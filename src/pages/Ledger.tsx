import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Wallet, Package } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Customer, getUserId, inr, showApiError, todayISO , safeErrorToast } from "@/lib/dairy";

type SaleRow = { id: string; date: string; customer_id: string };
type SaleItemRow = { sale_id: string; quantity: number; amount: number; product_id: string };
type ProductRow = { id: string; name: string; unit: string };
type PaymentRow = { id: string; sale_id: string | null; customer_id: string; amount: number; date: string; note: string | null; method: string };
type CrateRow = { id: string; customer_id: string; date: string; given: number; returned: number; note: string | null };

type LedgerLine = {
  saleId: string;
  date: string;
  items: { name: string; qty: number; amount: number; unit: string }[];
  total: number;
  paid: number;
  balance: number;
};

export default function Ledger() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [items, setItems] = useState<SaleItemRow[]>([]);
  const [products, setProducts] = useState<Record<string, ProductRow>>({});
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [crates, setCrates] = useState<CrateRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add-payment form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [paySaleId, setPaySaleId] = useState<string>("");
  const [payNote, setPayNote] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "online">("cash");
  const [busy, setBusy] = useState(false);

  // Crate-entry form
  const [crateDate, setCrateDate] = useState(todayISO());
  const [crateGiven, setCrateGiven] = useState("0");
  const [crateReturned, setCrateReturned] = useState("0");
  const [crateNote, setCrateNote] = useState("");
  const [crateBusy, setCrateBusy] = useState(false);

  // Initial: load customers
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name,phone,address")
        .order("name", { ascending: true });
      if (showApiError(error, "Could not load customers")) return;
      const list = (data as Customer[]) ?? [];
      setCustomers(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDetail = async (customerId: string) => {
    if (!customerId) return;
    setLoadingDetail(true);
    const [{ data: s, error: se }, { data: p, error: pe }, { data: pr, error: pre }, { data: cc, error: cce }] = await Promise.all([
      supabase.from("sales").select("id,date,customer_id").eq("customer_id", customerId).order("date", { ascending: false }),
      supabase.from("sale_payments").select("id,sale_id,customer_id,amount,date,note,method").eq("customer_id", customerId).order("date", { ascending: false }),
      supabase.from("products").select("id,name,unit"),
      supabase.from("customer_crates").select("id,customer_id,date,given,returned,note").eq("customer_id", customerId).order("date", { ascending: false }),
    ]);
    showApiError(se || pe || pre || cce, "Could not load ledger");
    const saleRows = (s as SaleRow[]) ?? [];
    setSales(saleRows);
    setPayments((p as PaymentRow[]) ?? []);
    setCrates((cc as CrateRow[]) ?? []);
    const prodMap: Record<string, ProductRow> = {};
    ((pr as ProductRow[]) ?? []).forEach((x) => (prodMap[x.id] = x));
    setProducts(prodMap);

    if (saleRows.length > 0) {
      const ids = saleRows.map((x) => x.id);
      const { data: si, error: sie } = await supabase
        .from("sale_items")
        .select("sale_id,quantity,amount,product_id")
        .in("sale_id", ids);
      showApiError(sie, "Could not load sale items");
      setItems((si as SaleItemRow[]) ?? []);
    } else {
      setItems([]);
    }
    setLoadingDetail(false);
  };

  const crateTotals = useMemo(() => {
    const given = crates.reduce((s, c) => s + Number(c.given || 0), 0);
    const returned = crates.reduce((s, c) => s + Number(c.returned || 0), 0);
    return { given, returned, outstanding: given - returned };
  }, [crates]);

  const recordCrate = async () => {
    const g = Number(crateGiven) || 0;
    const r = Number(crateReturned) || 0;
    if (!selectedCustomer) return toast.error("Pick a customer");
    if (g <= 0 && r <= 0) return toast.error("Enter crates given or returned");
    setCrateBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("customer_crates").insert({
        user_id: userId,
        customer_id: selectedCustomer.id,
        date: crateDate,
        given: g,
        returned: r,
        note: crateNote || null,
      });
      if (error) throw error;
      toast.success("Crate entry saved");
      setCrateGiven("0");
      setCrateReturned("0");
      setCrateNote("");
      loadDetail(selectedCustomer.id);
    } catch (err: any) {
      safeErrorToast(err, "Could not save crate entry");
    } finally {
      setCrateBusy(false);
    }
  };

  const removeCrate = async (id: string) => {
    if (!window.confirm("Delete this crate entry?")) return;
    const { error } = await supabase.from("customer_crates").delete().eq("id", id);
    if (error) return safeErrorToast(error, "Operation failed");
    toast.success("Crate entry removed");
    if (selectedId) loadDetail(selectedId);
  };

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const lines: LedgerLine[] = useMemo(() => {
    const paidBySale = new Map<string, number>();
    payments.forEach((pay) => {
      if (pay.sale_id) paidBySale.set(pay.sale_id, (paidBySale.get(pay.sale_id) ?? 0) + Number(pay.amount || 0));
    });
    return sales.map((sale) => {
      const its = items.filter((i) => i.sale_id === sale.id).map((i) => {
        const prod = products[i.product_id];
        return { name: prod?.name ?? "—", unit: prod?.unit ?? "", qty: Number(i.quantity), amount: Number(i.amount) };
      });
      const total = its.reduce((sum, x) => sum + x.amount, 0);
      const paid = paidBySale.get(sale.id) ?? 0;
      return { saleId: sale.id, date: sale.date, items: its, total, paid, balance: total - paid };
    });
  }, [sales, items, products, payments]);

  // Unallocated payments (not tied to a specific sale) reduce overall balance
  const unallocatedPaid = useMemo(
    () => payments.filter((p) => !p.sale_id).reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments],
  );
  const totals = useMemo(() => {
    const billed = lines.reduce((s, l) => s + l.total, 0);
    const paid = lines.reduce((s, l) => s + l.paid, 0) + unallocatedPaid;
    return { billed, paid, balance: billed - paid };
  }, [lines, unallocatedPaid]);

  const selectedCustomer = customers?.find((c) => c.id === selectedId) ?? null;

  const recordPayment = async () => {
    const amt = Number(payAmount);
    if (!selectedCustomer) return toast.error("Pick a customer");
    if (!amt || amt <= 0) return toast.error("Enter a payment amount");
    setBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("sale_payments").insert({
        user_id: userId,
        customer_id: selectedCustomer.id,
        sale_id: paySaleId || null,
        amount: amt,
        date: payDate,
        note: payNote || null,
        method: payMethod,
      });
      if (error) throw error;
      toast.success("Payment recorded");
      setPayAmount("");
      setPayNote("");
      setPaySaleId("");
      loadDetail(selectedCustomer.id);
    } catch (err: any) {
      safeErrorToast(err, "Could not save payment");
    } finally {
      setBusy(false);
    }
  };

  const removePayment = async (id: string) => {
    if (!window.confirm("Delete this payment?")) return;
    const { error } = await supabase.from("sale_payments").delete().eq("id", id);
    if (error) return safeErrorToast(error, "Operation failed");
    toast.success("Payment removed");
    if (selectedId) loadDetail(selectedId);
  };

  return (
    <>
      <PageHeader title="Customer Ledger" subtitle="Per-customer record of every bill, what was bought, and how much is paid." />

      {customers === null ? (
        <TableSkeleton rows={6} cols={4} />
      ) : customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers yet" description="Add customers first to start a ledger." />
      ) : (
        <div className="grid xl:grid-cols-[260px_1fr] gap-4 sm:gap-5">
          {/* Customer list — vertical on desktop, horizontal scroll on mobile */}
          <aside className="bg-card border border-border rounded-lg shadow-card p-2 sm:p-3 h-fit xl:max-h-[70vh] xl:overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-ink-3">Customers</div>
            <div className="flex xl:flex-col gap-2 xl:gap-0 overflow-x-auto xl:overflow-visible -mx-1 xl:mx-0 px-1 xl:px-0 pb-1 xl:pb-0">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`text-left px-3 py-2 rounded-md text-sm press transition-colors shrink-0 xl:shrink xl:w-auto min-w-[160px] xl:min-w-0 ${
                    selectedId === c.id ? "bg-forest text-cream" : "text-ink hover:bg-cream-d/40"
                  }`}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className={`text-[11px] ${selectedId === c.id ? "text-cream/70" : "text-ink-3"}`}>{c.phone || c.address || "—"}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Detail */}
          <section className="space-y-4 sm:space-y-5 min-w-0">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <SummaryCard label="Total billed" value={inr(totals.billed)} tone="ink" />
              <SummaryCard label="Total paid" value={inr(totals.paid)} tone="forest" />
              <SummaryCard label="Outstanding" value={inr(totals.balance)} tone={totals.balance > 0 ? "danger" : "forest"} />
            </div>

            {/* Record payment */}
            <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4 text-forest" />
                <h2 className="font-display text-lg sm:text-xl text-ink">Record payment{selectedCustomer ? ` from ${selectedCustomer.name}` : ""}</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-[140px_140px_140px_1fr_160px_auto] gap-3 items-end">
                <Field label="Date">
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input w-full" />
                </Field>
                <Field label="Amount (₹)">
                  <input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input w-full text-right font-tabular" placeholder="0" />
                </Field>
                <Field label="Method">
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as "cash" | "online")} className="input w-full">
                    <option value="cash">💵 Cash</option>
                    <option value="online">📱 Online</option>
                  </select>
                </Field>
                <Field label="Apply to bill (optional)" className="col-span-2 lg:col-span-1">
                  <select value={paySaleId} onChange={(e) => setPaySaleId(e.target.value)} className="input w-full">
                    <option value="">General (against any balance)</option>
                    {lines.filter((l) => l.balance > 0).map((l) => (
                      <option key={l.saleId} value={l.saleId}>
                        {l.date} · {inr(l.total)} (due {inr(l.balance)})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Note" className="col-span-2 lg:col-span-1">
                  <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className="input w-full" placeholder="Cash / UPI / etc." />
                </Field>
                <button onClick={recordPayment} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 col-span-2 lg:col-span-1">
                  {busy ? "Saving…" : "Add payment"}
                </button>
              </div>
            </div>

            {/* Bills history */}
            <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5">
              <h2 className="font-display text-lg sm:text-xl text-ink mb-4">Bill history</h2>
              {loadingDetail ? (
                <TableSkeleton rows={4} cols={5} />
              ) : lines.length === 0 ? (
                <EmptyState icon="🧾" title="No sales for this customer yet" />
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 border-y sm:border border-border sm:rounded-lg">
                  <table className="w-full min-w-[560px]">
                    <thead className="bg-forest text-cream">
                      <tr>
                        <Th>Date</Th>
                        <Th>Products</Th>
                        <Th className="text-right">Total</Th>
                        <Th className="text-right">Paid</Th>
                        <Th className="text-right">Balance</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => (
                        <tr key={l.saleId} className="border-t border-border-l align-top">
                          <Td className="font-tabular whitespace-nowrap">{l.date}</Td>
                          <Td>
                            <div className="flex flex-col gap-0.5">
                              {l.items.map((it, idx) => (
                                <div key={idx} className="text-sm text-ink">
                                  <span className="font-medium">{it.name}</span>
                                  <span className="text-ink-3"> · {it.qty} {it.unit} · </span>
                                  <span className="font-tabular">{inr(it.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </Td>
                          <Td className="text-right font-tabular">{inr(l.total)}</Td>
                          <Td className="text-right font-tabular text-forest">{inr(l.paid)}</Td>
                          <Td className={`text-right font-tabular font-semibold ${l.balance > 0 ? "text-danger" : "text-forest"}`}>{inr(l.balance)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payments log */}
            <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5">
              <h2 className="font-display text-lg sm:text-xl text-ink mb-4">Payments received</h2>
              {payments.length === 0 ? (
                <p className="text-sm text-ink-3">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const linkedSale = sales.find((s) => s.id === p.sale_id);
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 border border-border rounded-md p-3">
                        <div>
                          <div className="text-sm text-ink font-tabular">
                            {p.date} · <span className="font-semibold">{inr(Number(p.amount))}</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${p.method === "online" ? "bg-turmeric/20 text-ink" : "bg-forest/15 text-forest"}`}>
                              {p.method === "online" ? "Online" : "Cash"}
                            </span>
                          </div>
                          <div className="text-xs text-ink-3">
                            {linkedSale ? `Bill ${linkedSale.date}` : "General payment"}
                            {p.note ? ` · ${p.note}` : ""}
                          </div>
                        </div>
                        <button onClick={() => removePayment(p.id)} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-cream-d text-ink-3 hover:text-danger press">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Crate ledger */}
            <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-forest" />
                <h2 className="font-display text-lg sm:text-xl text-ink">Crate ledger{selectedCustomer ? ` · ${selectedCustomer.name}` : ""}</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                <SummaryCard label="Crates given" value={String(crateTotals.given)} tone="ink" />
                <SummaryCard label="Crates returned" value={String(crateTotals.returned)} tone="forest" />
                <SummaryCard
                  label="Outstanding crates"
                  value={String(crateTotals.outstanding)}
                  tone={crateTotals.outstanding > 0 ? "danger" : "forest"}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-[140px_120px_120px_1fr_auto] gap-3 items-end mb-5">
                <Field label="Date">
                  <input type="date" value={crateDate} onChange={(e) => setCrateDate(e.target.value)} className="input w-full" />
                </Field>
                <Field label="Given">
                  <input type="number" min="0" value={crateGiven} onChange={(e) => setCrateGiven(e.target.value)} className="input w-full text-right font-tabular" />
                </Field>
                <Field label="Returned">
                  <input type="number" min="0" value={crateReturned} onChange={(e) => setCrateReturned(e.target.value)} className="input w-full text-right font-tabular" />
                </Field>
                <Field label="Note" className="col-span-2 lg:col-span-1">
                  <input value={crateNote} onChange={(e) => setCrateNote(e.target.value)} className="input w-full" placeholder="Optional remark" />
                </Field>
                <button onClick={recordCrate} disabled={crateBusy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 col-span-2 lg:col-span-1">
                  {crateBusy ? "Saving…" : "Add entry"}
                </button>
              </div>

              {loadingDetail ? (
                <TableSkeleton rows={3} cols={5} />
              ) : crates.length === 0 ? (
                <EmptyState icon="📦" title="No crate entries yet" description="Record crates given to or returned by this customer." />
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 border-y sm:border border-border sm:rounded-lg">
                  <table className="w-full min-w-[560px]">
                    <thead className="bg-forest text-cream">
                      <tr>
                        <Th>Date</Th>
                        <Th className="text-right">Given</Th>
                        <Th className="text-right">Returned</Th>
                        <Th className="text-right">Net out</Th>
                        <Th>Note</Th>
                        <Th className="w-12" />
                      </tr>
                    </thead>
                    <tbody>
                      {crates.map((c) => {
                        const net = Number(c.given || 0) - Number(c.returned || 0);
                        return (
                          <tr key={c.id} className="border-t border-border-l">
                            <Td className="font-tabular whitespace-nowrap">{c.date}</Td>
                            <Td className="text-right font-tabular">{c.given}</Td>
                            <Td className="text-right font-tabular text-forest">{c.returned}</Td>
                            <Td className={`text-right font-tabular font-semibold ${net > 0 ? "text-danger" : net < 0 ? "text-forest" : "text-ink"}`}>{net}</Td>
                            <Td className="text-ink-2">{c.note || "—"}</Td>
                            <Td className="text-right">
                              <button onClick={() => removeCrate(c.id)} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-cream-d text-ink-3 hover:text-danger press">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{inputCss}</style>
    </>
  );
}

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</span>
    {children}
  </label>
);

const Th = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>
);

const SummaryCard = ({ label, value, tone }: { label: string; value: string; tone: "ink" | "forest" | "danger" }) => {
  const color = tone === "forest" ? "text-forest" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className={`mt-1 font-tabular text-2xl ${color}`}>{value}</div>
    </div>
  );
};

const inputCss = `.input{height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
