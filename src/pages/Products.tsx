/**
 * Products page — table + add/edit modal + delete confirm.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { showApiError } from "@/lib/dairy";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Product = {
  id: string;
  name: string;
  rate: number;
  unit: string;
  created_at: string;
  taxed: boolean;
  hsn_code: string | null;
  offer_buy_qty: number | null;
  offer_free_qty: number | null;
};

const UNITS = ["pouch", "box", "crate", "piece"] as const;

export default function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"taxed" | "nontaxed">("taxed");

  const load = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    showApiError(error, "Could not load products");
    setItems((data as Product[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    load();
  };

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const filtered = items?.filter((p) => (tab === "taxed" ? p.taxed : !p.taxed)) ?? null;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Your catalogue — split by taxed and non-taxed items."
        actions={
          items && items.length > 0 && (
            <button
              onClick={openNew}
              className="h-10 px-4 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l transition-colors press inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add {tab === "taxed" ? "taxed" : "non-taxed"} product
            </button>
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "taxed" | "nontaxed")} className="mb-4">
        <TabsList>
          <TabsTrigger value="taxed">Taxed products</TabsTrigger>
          <TabsTrigger value="nontaxed">Non-taxed products</TabsTrigger>
        </TabsList>
      </Tabs>

      {items === null || filtered === null ? (
        <TableSkeleton rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🥛"
          title={tab === "taxed" ? "No taxed products yet" : "No non-taxed products yet"}
          description={
            tab === "taxed"
              ? "Add items that attract GST or other taxes."
              : "Add items that are sold without tax."
          }
          action={
            <button
              onClick={openNew}
              className="h-10 px-4 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l transition-colors press inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add your first {tab === "taxed" ? "taxed" : "non-taxed"} product
            </button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-forest text-cream">
                <tr>
                  <Th className="w-14">#</Th>
                  <Th>Product</Th>
                  <Th>HSN</Th>
                  <Th className="text-right">Rate</Th>
                  <Th>Unit</Th>
                  <Th>Offer</Th>
                  <Th className="text-right w-32">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="border-t border-border-l hover:bg-cream-d/40 transition-colors">
                    <Td className="text-ink-3">{i + 1}</Td>
                    <Td className="font-medium text-ink">{p.name}</Td>
                    <Td className="text-ink-3 font-tabular">{p.hsn_code || "—"}</Td>
                    <Td className="text-right font-tabular text-ink">
                      ₹{Number(p.rate).toFixed(2)}
                    </Td>
                    <Td className="text-ink-3">per {p.unit}</Td>
                    <Td className="text-ink-3 font-tabular">
                      {p.offer_buy_qty && p.offer_free_qty
                        ? `Buy ${p.offer_buy_qty} get ${p.offer_free_qty} free`
                        : "—"}
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-cream-d text-ink-3 hover:text-forest press"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-cream-d text-ink-3 hover:text-danger press ml-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && (
        <ProductModal
          initial={editing}
          defaultTaxed={tab === "taxed"}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); load(); }}
        />
      )}
    </>
  );
}

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>
);

function ProductModal({
  initial,
  defaultTaxed,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  defaultTaxed: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [rate, setRate] = useState<string>(initial ? String(initial.rate) : "");
  const [unit, setUnit] = useState<string>(
    initial && (UNITS as readonly string[]).includes(initial.unit) ? initial.unit : "pouch"
  );
  const [taxed, setTaxed] = useState<boolean>(initial?.taxed ?? defaultTaxed);
  const [hsn, setHsn] = useState<string>(initial?.hsn_code ?? "");
  const [hasOffer, setHasOffer] = useState<boolean>(
    !!(initial?.offer_buy_qty && initial?.offer_free_qty)
  );
  const [offerBuy, setOfferBuy] = useState<string>(
    initial?.offer_buy_qty ? String(initial.offer_buy_qty) : ""
  );
  const [offerFree, setOfferFree] = useState<string>(
    initial?.offer_free_qty ? String(initial.offer_free_qty) : ""
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name is required");
    const r = Number(rate);
    if (!Number.isFinite(r) || r < 0) return toast.error("Rate must be a positive number");
    const hsnTrim = hsn.trim();
    if (hsnTrim && !/^[0-9]{4,8}$/.test(hsnTrim)) {
      return toast.error("HSN code must be 4–8 digits");
    }

    let offerBuyNum: number | null = null;
    let offerFreeNum: number | null = null;
    if (hasOffer) {
      offerBuyNum = Number(offerBuy);
      offerFreeNum = Number(offerFree);
      if (!Number.isInteger(offerBuyNum) || offerBuyNum <= 0) {
        return toast.error("Buy quantity must be a whole number greater than 0");
      }
      if (!Number.isInteger(offerFreeNum) || offerFreeNum <= 0) {
        return toast.error("Free quantity must be a whole number greater than 0");
      }
    }

    setBusy(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from("products")
          .update({
            name: trimmed,
            rate: r,
            unit,
            taxed,
            hsn_code: hsnTrim || null,
            offer_buy_qty: offerBuyNum,
            offer_free_qty: offerFreeNum,
          })
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { error } = await supabase
          .from("products")
          .insert({
            name: trimmed,
            rate: r,
            unit,
            taxed,
            hsn_code: hsnTrim || null,
            offer_buy_qty: offerBuyNum,
            offer_free_qty: offerFreeNum,
            user_id: user.id,
          });
        if (error) throw error;
        toast.success("Product added");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div className="modal-pop relative bg-card border border-border rounded-lg shadow-modal w-full max-w-md p-6">
        <h3 className="font-display text-2xl text-ink">
          {initial ? "Edit product" : "Add product"}
        </h3>
        <p className="text-sm text-ink-3 mt-1">Name, rate and unit.</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Product name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Toned Milk 500ml"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (₹)">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="input font-tabular"
                placeholder="0.00"
              />
            </Field>
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          <Field label="HSN code (optional)">
            <input
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
              className="input font-tabular"
              placeholder="e.g. 0401"
              inputMode="numeric"
              maxLength={8}
            />
          </Field>

          <Field label="Tax category">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaxed(true)}
                className={`h-10 px-4 rounded-md text-sm font-medium press border ${
                  taxed
                    ? "bg-forest text-cream border-forest"
                    : "bg-card text-ink-2 border-border hover:bg-cream-d"
                }`}
              >
                Taxed
              </button>
              <button
                type="button"
                onClick={() => setTaxed(false)}
                className={`h-10 px-4 rounded-md text-sm font-medium press border ${
                  !taxed
                    ? "bg-forest text-cream border-forest"
                    : "bg-card text-ink-2 border-border hover:bg-cream-d"
                }`}
              >
                Non-taxed
              </button>
            </div>
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md text-sm text-ink-2 hover:bg-cream-d press">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60"
            >
              {busy ? "Saving…" : initial ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>

        <style>{`
          .input {
            width: 100%;
            height: 2.5rem;
            padding: 0 0.875rem;
            border-radius: 0.5rem;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--card));
            color: hsl(var(--ink));
            font-size: 0.875rem;
            outline: none;
            transition: border-color 160ms, box-shadow 160ms;
          }
          .input:focus {
            border-color: hsl(var(--turmeric));
            box-shadow: 0 0 0 3px hsl(var(--turmeric) / 0.18);
          }
        `}</style>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="text-xs font-medium text-ink-2 mb-1.5">{label}</div>
    {children}
  </label>
);
