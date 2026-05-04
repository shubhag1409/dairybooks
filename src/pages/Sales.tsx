import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { CustomerGridSkeleton, TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Customer, getUserId, inr, Product, showApiError, todayISO , safeErrorToast } from "@/lib/dairy";

type Sale = { id: string; date: string; customer_id: string; customers?: { name: string } | null };
type SaleItem = { sale_id: string; amount: number };

export default function Sales() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(todayISO());
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<(Sale & { total: number })[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: c, error: ce }, { data: p, error: pe }, { data: s, error: se }, { data: si, error: sie }] = await Promise.all([
      supabase.from("customers").select("id,name,phone,address").order("created_at", { ascending: true }),
      supabase.from("products").select("id,name,rate,unit,offer_buy_qty,offer_free_qty").order("created_at", { ascending: true }),
      supabase.from("sales").select("id,date,customer_id,customers(name)").order("date", { ascending: false }).limit(30),
      supabase.from("sale_items").select("sale_id,amount"),
    ]);
    const error = ce || pe || se || sie;
    showApiError(error, "Could not load sales data");
    setCustomers((c as Customer[]) ?? []);
    setProducts((p as Product[]) ?? []);
    const totals = new Map<string, number>();
    ((si as SaleItem[]) ?? []).forEach((item) => totals.set(item.sale_id, (totals.get(item.sale_id) ?? 0) + Number(item.amount || 0)));
    setHistory(((s as Sale[]) ?? []).map((sale) => ({ ...sale, total: totals.get(sale.id) ?? 0 })));
  };

  useEffect(() => { load(); }, []);
  const billedQty = (p: Product, q: number) => {
    const buy = Number(p.offer_buy_qty) || 0;
    const free = Number(p.offer_free_qty) || 0;
    if (buy > 0 && free > 0 && q >= buy + free) {
      const groupSize = buy + free;
      const freeUnits = Math.floor(q / groupSize) * free;
      return Math.max(0, q - freeUnits);
    }
    return q;
  };
  const total = useMemo(
    () =>
      (products ?? []).reduce(
        (sum, p) => sum + billedQty(p, Number(qty[p.id]) || 0) * Number(p.rate || 0),
        0,
      ),
    [products, qty],
  );

  const chooseCustomer = (customer: Customer) => { setSelected(customer); setStep(3); };

  const save = async () => {
    if (!selected) return toast.error("Pick a customer");
    const lines = (products ?? [])
      .map((p) => ({ product: p, quantity: Number(qty[p.id]) || 0 }))
      .filter((x) => x.quantity > 0);
    if (lines.length === 0) return toast.error("Enter at least one sale quantity");
    const bad = lines.find((x) => !Number.isInteger(x.quantity));
    if (bad) return toast.error("Quantities must be whole numbers");
    setBusy(true);
    try {
      const userId = await getUserId();
      const { data: sale, error: saleError } = await supabase.from("sales").insert({ date, customer_id: selected.id, user_id: userId }).select("id").single();
      if (saleError) throw saleError;
      const { error: itemError } = await supabase.from("sale_items").insert(lines.map(({ product, quantity }) => ({
        sale_id: sale.id,
        product_id: product.id,
        quantity,
        amount: billedQty(product, quantity) * Number(product.rate || 0),
        user_id: userId,
      })));
      if (itemError) throw itemError;
      toast.success("Sale saved");
      // Deduct from inventory
      const adjustments = lines.map(({ product, quantity }) => ({
        user_id: userId,
        product_id: product.id,
        quantity: -quantity,
        reason: "sale",
        reference_id: sale.id,
        date,
      }));
      await supabase.from("inventory_adjustments").insert(adjustments);
      setQty({});
      setStep(2);
      load();
    } catch (err: any) {
      safeErrorToast(err, "Could not save sale");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this sale entry?")) return;
    // Remove related inventory adjustments first
    await supabase.from("inventory_adjustments").delete().eq("reference_id", id).eq("reason", "sale");
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return safeErrorToast(error, "Operation failed");
    toast.success("Sale deleted");
    load();
  };

  return (
    <>
      <PageHeader title="Sales Tracking" subtitle="Three steps: choose date, pick customer, enter quantities." />
      <div className="grid xl:grid-cols-[1fr_360px] gap-4 sm:gap-5">
        <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 min-h-[420px]">
          <div className="flex gap-2 mb-6" aria-label="Sales steps">
            {["Date", "Customer", "Entry"].map((label, i) => <div key={label} className={`h-2 flex-1 rounded-full ${step >= i + 1 ? "bg-turmeric" : "bg-cream-d"}`} />)}
          </div>
          {step === 1 && <div className="max-w-sm"><h2 className="font-display text-2xl text-ink mb-2">Pick sale date</h2><p className="text-sm text-ink-3 mb-5">This date applies to every customer bill you enter next.</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /><button onClick={() => setStep(2)} className="mt-4 h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press">Continue</button></div>}
          {step === 2 && (customers === null ? <CustomerGridSkeleton /> : customers.length === 0 ? <EmptyState icon="👥" title="Add customers first" description="Sales entry needs customers on your route." /> : <><button onClick={() => setStep(1)} className="mb-4 text-sm text-ink-3 hover:text-forest inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Change date</button><div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{customers.map((c) => <button key={c.id} onClick={() => chooseCustomer(c)} className="text-left border border-border rounded-lg p-4 bg-cream-d/30 hover:border-turmeric/50 hover:bg-card lift"><div className="font-medium text-ink">{c.name}</div><div className="text-xs text-ink-3 mt-1">{c.phone || c.address || "No details"}</div></button>)}</div></>)}
          {step === 3 && (!selected || products === null ? <TableSkeleton rows={5} cols={4} /> : products.length === 0 ? <EmptyState icon="🥛" title="Add products first" /> : <><button onClick={() => setStep(2)} className="mb-4 text-sm text-ink-3 hover:text-forest inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Back to customers</button><div className="mb-5"><h2 className="font-display text-xl sm:text-2xl text-ink">{selected.name}</h2><p className="text-sm text-ink-3">Sale date: {date}</p></div><div className="overflow-x-auto -mx-4 sm:mx-0 border-y sm:border border-border sm:rounded-lg"><table className="w-full min-w-[480px]"><thead className="bg-forest text-cream"><tr><Th>Product</Th><Th className="text-right">Rate</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th></tr></thead><tbody>{products.map((p) => { const q = Number(qty[p.id]) || 0; const billed = billedQty(p, q); const free = q - billed; return <tr key={p.id} className="border-t border-border-l"><Td className="font-medium text-ink">{p.name}{p.offer_buy_qty && p.offer_free_qty ? <div className="text-xs text-turmeric font-normal mt-0.5">Buy {p.offer_buy_qty} get {p.offer_free_qty} free</div> : null}</Td><Td className="text-right font-tabular">{inr(Number(p.rate))}</Td><Td className="text-right"><input value={qty[p.id] ?? ""} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d+$/.test(v)) setQty((old) => ({ ...old, [p.id]: v })); }} type="number" min="0" step="1" inputMode="numeric" className="input text-right font-tabular w-20 sm:w-28" placeholder="0" />{free > 0 ? <div className="text-[11px] text-ink-3 mt-1">+{free} free</div> : null}</Td><Td className="text-right font-tabular text-ink">{inr(billed * Number(p.rate || 0))}</Td></tr>; })}</tbody></table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">Bill total</div><div className="font-tabular text-2xl text-ink">{inr(total)}</div></div><button onClick={save} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center gap-2"><Save className="h-4 w-4" />{busy ? "Saving…" : "Save sale"}</button></div></>)}
        </section>
        <aside className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 h-fit"><h2 className="font-display text-xl text-ink mb-4">Recent sales</h2>{history === null ? <TableSkeleton rows={4} cols={2} /> : history.length === 0 ? <p className="text-sm text-ink-3">No sales recorded yet.</p> : <div className="space-y-3">{history.map((s) => <div key={s.id} className="border border-border rounded-md p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-sm font-medium text-ink truncate">{s.customers?.name ?? "Customer"}</div><div className="text-xs text-ink-3 font-tabular">{s.date} · {inr(s.total)}</div></div><button onClick={() => remove(s.id)} className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded hover:bg-cream-d text-ink-3 hover:text-danger press"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</aside>
      </div>
      <style>{inputCss}</style>
    </>
  );
}
const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>;
const inputCss = `.input{height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
