import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { inr, safeErrorToast } from "@/lib/dairy";
import { cn } from "@/lib/utils";

type SaleRow = { date: string; amount: number };
type PaymentRow = { date: string; amount: number; note: string | null };
type CustomerDue = {
  id: string;
  name: string;
  phone: string | null;
  totalBilled: number;
  totalPaid: number;
  due: number;
  sales: SaleRow[];
  payments: PaymentRow[];
};

export default function Tagada() {
  const [data, setData] = useState<CustomerDue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const [{ data: customers, error: ce }, { data: sales, error: se }, { data: saleItems, error: sie }, { data: payments, error: pe }] =
        await Promise.all([
          supabase.from("customers").select("id,name,phone"),
          supabase.from("sales").select("id,date,customer_id"),
          supabase.from("sale_items").select("sale_id,amount"),
          supabase.from("sale_payments").select("customer_id,date,amount,note"),
        ]);

      const err = ce || se || sie || pe;
      if (err) throw err;

      // Build sale totals per sale
      const saleTotals = new Map<string, number>();
      (saleItems ?? []).forEach((si) => saleTotals.set(si.sale_id, (saleTotals.get(si.sale_id) ?? 0) + Number(si.amount)));

      // Group sales by customer
      const customerSales = new Map<string, SaleRow[]>();
      const customerBilled = new Map<string, number>();
      (sales ?? []).forEach((s) => {
        const amt = saleTotals.get(s.id) ?? 0;
        if (!customerSales.has(s.customer_id)) customerSales.set(s.customer_id, []);
        customerSales.get(s.customer_id)!.push({ date: s.date, amount: amt });
        customerBilled.set(s.customer_id, (customerBilled.get(s.customer_id) ?? 0) + amt);
      });

      // Group payments by customer
      const customerPayments = new Map<string, PaymentRow[]>();
      const customerPaid = new Map<string, number>();
      (payments ?? []).forEach((p) => {
        if (!customerPayments.has(p.customer_id)) customerPayments.set(p.customer_id, []);
        customerPayments.get(p.customer_id)!.push({ date: p.date, amount: Number(p.amount), note: p.note });
        customerPaid.set(p.customer_id, (customerPaid.get(p.customer_id) ?? 0) + Number(p.amount));
      });

      const result: CustomerDue[] = [];
      (customers ?? []).forEach((c) => {
        const billed = customerBilled.get(c.id) ?? 0;
        const paid = customerPaid.get(c.id) ?? 0;
        const due = billed - paid;
        if (due > 0) {
          result.push({
            id: c.id,
            name: c.name,
            phone: c.phone,
            totalBilled: billed,
            totalPaid: paid,
            due,
            sales: (customerSales.get(c.id) ?? []).sort((a, b) => b.date.localeCompare(a.date)),
            payments: (customerPayments.get(c.id) ?? []).sort((a, b) => b.date.localeCompare(a.date)),
          });
        }
      });

      result.sort((a, b) => b.due - a.due);
      setData(result);
      setExpanded(null);
      if (result.length === 0) toast.info("All customers are fully paid!");
    } catch (err) {
      safeErrorToast(err, "Could not generate tagada list");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const totalDue = data?.reduce((s, c) => s + c.due, 0) ?? 0;

  return (
    <>
      <PageHeader title="Tagada (Outstanding Dues)" subtitle="Generate a list of customers with unpaid balances." />

      <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground">
            Click Generate to see all customers who owe money.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {data !== null && (
          <>
            {data.length > 0 && (
              <div className="mb-4 p-3 rounded-md bg-danger/10 border border-danger/20">
                <span className="text-sm font-semibold text-danger">
                  Total Outstanding: {inr(totalDue)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({data.length} customer{data.length > 1 ? "s" : ""})
                </span>
              </div>
            )}

            <div className="space-y-2">
              {data.map((c) => (
                <div key={c.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggle(c.id)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{c.name}</div>
                      {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-tabular text-danger font-semibold">{inr(c.due)}</span>
                      {expanded === c.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expanded === c.id && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Billed</div>
                          <div className="font-tabular text-lg text-foreground">{inr(c.totalBilled)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paid</div>
                          <div className="font-tabular text-lg text-green-600">{inr(c.totalPaid)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Due</div>
                          <div className="font-tabular text-lg text-danger font-semibold">{inr(c.due)}</div>
                        </div>
                      </div>

                      {/* Sales history */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sales (Billed)</h4>
                        {c.sales.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No sales</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {c.sales.map((s, i) => (
                              <div key={i} className="flex justify-between text-sm px-2 py-1 rounded bg-card">
                                <span className="font-tabular text-muted-foreground">{s.date}</span>
                                <span className="font-tabular text-foreground">{inr(s.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment history */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payments (Received)</h4>
                        {c.payments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No payments received</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {c.payments.map((p, i) => (
                              <div key={i} className="flex justify-between text-sm px-2 py-1 rounded bg-card">
                                <span className="font-tabular text-muted-foreground">{p.date}</span>
                                <span className="font-tabular text-green-600">{inr(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}