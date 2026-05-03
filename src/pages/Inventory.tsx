import { useEffect, useMemo, useState } from "react";
import { Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, inr, Product, showApiError, todayISO } from "@/lib/dairy";

type Adjustment = {
  id: string;
  product_id: string;
  quantity: number;
  reason: string;
  note: string | null;
  date: string;
  created_at: string;
};

const REASONS = ["Spoilage", "Expired", "Damaged", "Other"] as const;

export default function Inventory() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[] | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [showRemove, setShowRemove] = useState(false);
  const [removeProductId, setRemoveProductId] = useState("");
  const [removeQty, setRemoveQty] = useState("");
  const [removeReason, setRemoveReason] = useState<string>(REASONS[0]);
  const [removeNote, setRemoveNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: p, error: pe }, { data: a, error: ae }] = await Promise.all([
      supabase.from("products").select("id,name,rate,unit").order("created_at", { ascending: true }),
      supabase.from("inventory_adjustments").select("id,product_id,quantity,reason,note,date,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    showApiError(pe || ae, "Could not load inventory data");
    setProducts((p as Product[]) ?? []);
    setAdjustments((a as Adjustment[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const stock = useMemo(() => {
    const map = new Map<string, number>();
    (adjustments ?? []).forEach((a) => map.set(a.product_id, (map.get(a.product_id) ?? 0) + Number(a.quantity)));
    return map;
  }, [adjustments]);

  const filteredAdjustments = useMemo(() => {
    if (!filterDate) return adjustments ?? [];
    return (adjustments ?? []).filter((a) => a.date === filterDate);
  }, [adjustments, filterDate]);

  const reasonColor = (r: string) => {
    switch (r.toLowerCase()) {
      case "purchase": return "text-green-600";
      case "sale": return "text-blue-600";
      default: return "text-red-500";
    }
  };

  const handleRemove = async () => {
    if (!removeProductId) return toast.error("Select a product");
    const qty = Number(removeQty);
    if (!qty || qty <= 0) return toast.error("Enter a valid quantity");
    setBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("inventory_adjustments").insert({
        user_id: userId,
        product_id: removeProductId,
        quantity: -qty,
        reason: removeReason.toLowerCase(),
        note: removeNote || null,
        date: todayISO(),
      });
      if (error) throw error;
      toast.success("Stock removed");
      setShowRemove(false);
      setRemoveProductId("");
      setRemoveQty("");
      setRemoveNote("");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not remove stock");
    } finally {
      setBusy(false);
    }
  };

  const deleteAdjustment = async (id: string) => {
    if (!window.confirm("Delete this adjustment?")) return;
    const { error } = await supabase.from("inventory_adjustments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Adjustment deleted");
    load();
  };

  const productName = (id: string) => (products ?? []).find((p) => p.id === id)?.name ?? "Unknown";

  if (products === null || adjustments === null) {
    return (
      <>
        <PageHeader title="Inventory" subtitle="Track your current stock levels." />
        <TableSkeleton rows={6} cols={3} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Current stock from purchases minus sales. Remove spoiled or damaged items manually." />

      {/* Current Stock */}
      <section className="bg-card border border-border rounded-lg shadow-card overflow-hidden mb-4 sm:mb-5">
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">Current Stock</h2>
          <button
            onClick={() => setShowRemove(true)}
            className="h-9 px-4 rounded-md bg-danger text-cream text-sm font-medium hover:bg-danger/90 press inline-flex items-center gap-2"
          >
            <Minus className="h-4 w-4" />
            Remove Stock
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-forest text-cream">
              <tr>
                <Th>Product</Th>
                <Th>Unit</Th>
                <Th className="text-right">In Stock</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const qty = stock.get(p.id) ?? 0;
                return (
                  <tr key={p.id} className="border-t border-border-l">
                    <Td className="font-medium text-ink">{p.name}</Td>
                    <Td className="text-ink-3">{p.unit}</Td>
                    <Td className={`text-right font-tabular ${qty <= 0 ? "text-danger font-semibold" : "text-ink"}`}>
                      {qty}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Movement History */}
      <section className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">Movement History</h2>
          <label className="text-xs font-medium text-ink-2">
            Filter date
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input ml-2"
            />
          </label>
          {filterDate && (
            <button onClick={() => setFilterDate("")} className="text-xs text-ink-3 hover:text-forest underline">
              Clear
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead className="bg-forest text-cream">
              <tr>
                <Th>Date</Th>
                <Th>Product</Th>
                <Th className="text-right">Qty</Th>
                <Th>Reason</Th>
                <Th>Note</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center text-ink-3">
                    No movements{filterDate ? ` on ${filterDate}` : ""}.
                  </Td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => (
                  <tr key={a.id} className="border-t border-border-l">
                    <Td className="text-ink-3">{a.date}</Td>
                    <Td className="font-medium text-ink">{productName(a.product_id)}</Td>
                    <Td className={`text-right font-tabular ${Number(a.quantity) > 0 ? "text-green-600" : "text-red-500"}`}>
                      {Number(a.quantity) > 0 ? "+" : ""}{a.quantity}
                    </Td>
                    <Td className={`capitalize ${reasonColor(a.reason)}`}>{a.reason}</Td>
                    <Td className="text-ink-3 max-w-[160px] truncate">{a.note || "—"}</Td>
                    <Td className="text-right">
                      {!["purchase", "sale"].includes(a.reason) && (
                        <button
                          onClick={() => deleteAdjustment(a.id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-cream-d text-ink-3 hover:text-danger press"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Remove Stock Modal */}
      {showRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowRemove(false)} />
          <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-display text-xl text-ink">Remove Stock</h3>

            <label className="block text-xs font-medium text-ink-2">
              Product
              <select
                value={removeProductId}
                onChange={(e) => setRemoveProductId(e.target.value)}
                className="input mt-1 w-full"
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {stock.get(p.id) ?? 0})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-ink-2">
              Quantity to remove
              <input
                type="number"
                min="1"
                value={removeQty}
                onChange={(e) => setRemoveQty(e.target.value)}
                className="input mt-1 w-full"
                placeholder="0"
              />
            </label>

            <label className="block text-xs font-medium text-ink-2">
              Reason
              <select
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="input mt-1 w-full"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-ink-2">
              Note (optional)
              <input
                type="text"
                value={removeNote}
                onChange={(e) => setRemoveNote(e.target.value)}
                className="input mt-1 w-full"
                placeholder="e.g. milk curdled"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRemove(false)}
                className="h-9 px-4 rounded-md border border-border text-sm text-ink-2 hover:bg-cream-d press"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={busy}
                className="h-9 px-4 rounded-md bg-danger text-cream text-sm font-medium hover:bg-danger/90 press disabled:opacity-60"
              >
                {busy ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{inputCss}</style>
    </>
  );
}

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) => (
  <td className={`px-4 py-3.5 text-sm ${className}`} colSpan={colSpan}>{children}</td>
);
const inputCss = `.input{height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;