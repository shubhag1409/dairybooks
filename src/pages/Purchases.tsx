import { useEffect, useMemo, useState, useCallback } from "react";
import { Upload, Save, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, inr, Product, showApiError, todayISO , safeErrorToast } from "@/lib/dairy";

type PurchaseRow = { id: string; date: string; invoice_path: string | null };
type ItemRow = { id: string; purchase_id: string; product_id: string; quantity: number; price: number };

export default function Purchases() {
  const [date, setDate] = useState(todayISO());
  const [products, setProducts] = useState<Product[] | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [history, setHistory] = useState<(PurchaseRow & { total: number })[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [allItems, setAllItems] = useState<ItemRow[]>([]);

  const load = async () => {
    const [{ data: productsData, error: productError }, { data: purchases, error: purchaseError }, { data: items, error: itemError }] = await Promise.all([
      supabase.from("products").select("id,name,rate,unit").order("created_at", { ascending: true }),
      supabase.from("purchases").select("id,date,invoice_path").order("date", { ascending: false }).limit(30),
      supabase.from("purchase_items").select("id,purchase_id,product_id,quantity,price").limit(5000),
    ]);
    const error = productError || purchaseError || itemError;
    showApiError(error, "Could not load purchase data");
    setProducts((productsData as Product[]) ?? []);
    setAllItems((items as ItemRow[]) ?? []);
    const totals = new Map<string, number>();
    ((items as ItemRow[]) ?? []).forEach((item) => totals.set(item.purchase_id, (totals.get(item.purchase_id) ?? 0) + Number(item.price || 0)));
    setHistory(((purchases as PurchaseRow[]) ?? []).map((p) => ({ ...p, total: totals.get(p.id) ?? 0 })));
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => (products ?? []).reduce((sum, p) => sum + (Number(quantities[p.id]) || 0) * Number(p.rate || 0), 0), [products, quantities]);

  const save = async () => {
    const lines = (products ?? []).map((p) => ({ product: p, qty: Number(quantities[p.id]) || 0 })).filter((line) => line.qty > 0);
    if (!date) return toast.error("Pick a purchase date");
    if (lines.length === 0) return toast.error("Enter at least one quantity");
    setBusy(true);
    try {
      const userId = await getUserId();
      let invoicePath: string | null = null;
      if (file) {
        invoicePath = `${userId}/${date}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("invoices").upload(invoicePath, file);
        if (error) throw error;
      }
      const { data: purchase, error: purchaseError } = await supabase.from("purchases").insert({ date, invoice_path: invoicePath, user_id: userId }).select("id").single();
      if (purchaseError) throw purchaseError;
      const { error: itemError } = await supabase.from("purchase_items").insert(lines.map(({ product, qty }) => ({
        purchase_id: purchase.id,
        product_id: product.id,
        quantity: qty,
        price: qty * Number(product.rate || 0),
        user_id: userId,
      })));
      if (itemError) throw itemError;
      toast.success("Purchase saved");
      // Add inventory adjustments
      const adjustments = lines.map(({ product, qty }) => ({
        user_id: userId,
        product_id: product.id,
        quantity: qty,
        reason: "purchase",
        reference_id: purchase.id,
        date,
      }));
      await supabase.from("inventory_adjustments").insert(adjustments);
      setQuantities({});
      setFile(null);
      load();
    } catch (err: any) {
      safeErrorToast(err, "Could not save purchase");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this purchase entry?")) return;
    // Remove related inventory adjustments first
    await supabase.from("inventory_adjustments").delete().eq("reference_id", id).eq("reason", "purchase");
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) return safeErrorToast(error, "Operation failed");
    toast.success("Purchase deleted");
    load();
  };

  return (
    <>
      <PageHeader title="Purchase Tracking" subtitle="Log daily purchases from the company with optional invoice upload." />
      {products === null ? <TableSkeleton rows={6} cols={4} /> : products.length === 0 ? (
        <EmptyState icon="🥛" title="Add products first" description="Purchase entry needs your product catalogue so rates can be calculated." />
      ) : (
        <div className="grid xl:grid-cols-[1fr_360px] gap-4 sm:gap-5">
          <section className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex flex-wrap gap-3 items-end justify-between">
              <label className="text-xs font-medium text-ink-2">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1.5" /></label>
              <label className="h-10 px-4 rounded-md border border-border bg-cream-d text-sm text-ink-2 hover:border-turmeric/40 press inline-flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" />{file ? file.name : "Attach invoice"}<input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]"><thead className="bg-forest text-cream"><tr><Th>Product</Th><Th>Unit</Th><Th className="text-right">Rate</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th></tr></thead><tbody>{products.map((p) => { const qty = Number(quantities[p.id]) || 0; return <tr key={p.id} className="border-t border-border-l"><Td className="font-medium text-ink">{p.name}</Td><Td className="text-ink-3">{p.unit}</Td><Td className="text-right font-tabular">{inr(Number(p.rate))}</Td><Td className="text-right"><input type="number" min="0" step="0.01" value={quantities[p.id] ?? ""} onChange={(e) => setQuantities((q) => ({ ...q, [p.id]: e.target.value }))} className="input text-right font-tabular w-20 sm:w-28" placeholder="0" /></Td><Td className="text-right font-tabular text-ink">{inr(qty * Number(p.rate || 0))}</Td></tr>; })}</tbody></table>
            </div>
            <div className="p-4 sm:p-5 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-cream-d/45"><div><div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">Total purchase</div><div className="font-tabular text-2xl text-ink">{inr(total)}</div></div><button onClick={save} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center gap-2"><Save className="h-4 w-4" />{busy ? "Saving…" : "Save purchase"}</button></div>
          </section>
          <History history={history} onDelete={remove} products={products} allItems={allItems} />
        </div>
      )}
      <style>{inputCss}</style>
    </>
  );
}

function History({ history, onDelete, products, allItems }: { history: (PurchaseRow & { total: number })[] | null; onDelete: (id: string) => void; products: Product[]; allItems: ItemRow[] }) {
  const [searchDate, setSearchDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!history) return <TableSkeleton rows={5} cols={2} />;

  const filtered = searchDate ? history.filter((p) => p.date === searchDate) : history;
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Unknown";
  const productUnit = (id: string) => products.find((p) => p.id === id)?.unit ?? "";

  return (
    <aside className="bg-card border border-border rounded-lg shadow-card p-5 h-fit">
      <h2 className="font-display text-xl text-ink mb-3">Purchase History</h2>
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-ink-3" />
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="input flex-1 text-sm"
          placeholder="Search by date"
        />
        {searchDate && (
          <button onClick={() => setSearchDate("")} className="text-xs text-ink-3 hover:text-forest underline">Clear</button>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-3">{searchDate ? `No purchases on ${searchDate}.` : "No purchases recorded yet."}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            const items = allItems.filter((i) => i.purchase_id === p.id);
            return (
              <div key={p.id} className="border border-border rounded-md overflow-hidden">
                <div className="p-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="flex-1 text-left flex items-center gap-2"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-ink-3" /> : <ChevronDown className="h-4 w-4 text-ink-3" />}
                    <div>
                      <div className="text-sm font-medium text-ink">{p.date}</div>
                      <div className="text-xs text-ink-3 font-tabular">{inr(p.total)}{p.invoice_path ? " · invoice" : ""}</div>
                    </div>
                  </button>
                  <button onClick={() => onDelete(p.id)} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-cream-d text-ink-3 hover:text-danger press" aria-label="Delete purchase">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-border bg-cream-d/30 px-3 py-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-ink-3">
                          <th className="text-left py-1 font-semibold">Product</th>
                          <th className="text-right py-1 font-semibold">Qty</th>
                          <th className="text-right py-1 font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t border-border-l">
                            <td className="py-1.5 text-ink font-medium">{productName(item.product_id)}</td>
                            <td className="py-1.5 text-right font-tabular text-ink-2">{item.quantity} {productUnit(item.product_id)}</td>
                            <td className="py-1.5 text-right font-tabular text-ink">{inr(Number(item.price))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>;
const inputCss = `.input{height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
