/**
 * Customers page — table + add/edit modal + delete confirm.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { showApiError } from "@/lib/dairy";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  pan_number: string | null;
  gst_number: string | null;
  aadhaar_number: string | null;
};

export default function Customers() {
  const [items, setItems] = useState<Customer[] | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: true });
    showApiError(error, "Could not load customers");
    setItems((data as Customer[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (c: Customer) => {
    if (!window.confirm(`Remove "${c.name}"? Their existing sales records will be removed too.`)) return;
    const { error } = await supabase.from("customers").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Customer removed");
    load();
  };

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setOpen(true); };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Shops, hotels and households on your route."
        actions={
          items && items.length > 0 && (
            <button
              onClick={openNew}
              className="h-10 px-4 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l transition-colors press inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add customer
            </button>
          )
        }
      />

      {items === null ? (
        <TableSkeleton rows={5} cols={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No customers yet"
          description="Add a shop or household you deliver to. You'll be able to log sales for them per day."
          action={
            <button
              onClick={openNew}
              className="h-10 px-4 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l transition-colors press inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add your first customer
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
                  <Th>Name / Shop</Th>
                  <Th>Phone</Th>
                  <Th>Area / Address</Th>
                  <Th>GST</Th>
                  <Th>PAN</Th>
                  <Th>Aadhaar</Th>
                  <Th className="text-right w-32">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => (
                  <tr key={c.id} className="border-t border-border-l hover:bg-cream-d/40 transition-colors">
                    <Td className="text-ink-3">{i + 1}</Td>
                    <Td className="font-medium text-ink">{c.name}</Td>
                    <Td className="text-ink-2 font-tabular">{c.phone || "—"}</Td>
                    <Td className="text-ink-3">{c.address || "—"}</Td>
                    <Td className="text-ink-2 font-tabular">{c.gst_number || "—"}</Td>
                    <Td className="text-ink-2 font-tabular">{c.pan_number || "—"}</Td>
                    <Td className="text-ink-2 font-tabular">{c.aadhaar_number || "—"}</Td>
                    <Td className="text-right">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-cream-d text-ink-3 hover:text-forest press"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
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
        <CustomerModal
          initial={editing}
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

function CustomerModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [gst, setGst] = useState(initial?.gst_number ?? "");
  const [pan, setPan] = useState(initial?.pan_number ?? "");
  const [aadhaar, setAadhaar] = useState(initial?.aadhaar_number ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name is required");

    setBusy(true);
    try {
      const payload = {
        name: trimmed,
        phone: phone.trim() || null,
        address: address.trim() || null,
        gst_number: gst.trim().toUpperCase() || null,
        pan_number: pan.trim().toUpperCase() || null,
        aadhaar_number: aadhaar.trim() || null,
      };
      if (initial) {
        const { error } = await supabase.from("customers").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Customer updated");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { error } = await supabase.from("customers").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Customer added");
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
          {initial ? "Edit customer" : "Add customer"}
        </h3>
        <p className="text-sm text-ink-3 mt-1">Just the basics — you can refine later.</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Name / Shop name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cust-input"
              placeholder="e.g. Sharma General Store"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="cust-input font-tabular"
              placeholder="+91 98xxxxxxxx"
              inputMode="tel"
            />
          </Field>
          <Field label="Area / Address (optional)">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="cust-input min-h-[72px] py-2"
              placeholder="Sector 14, Main Road, …"
              rows={3}
            />
          </Field>
          <Field label="GST number (optional)">
            <input
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              className="cust-input font-tabular uppercase"
              placeholder="22ABCDE1234F1Z5"
              maxLength={15}
            />
          </Field>
          <Field label="PAN number (optional)">
            <input
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              className="cust-input font-tabular uppercase"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </Field>
          <Field label="Aadhaar number (optional)">
            <input
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, ""))}
              className="cust-input font-tabular"
              placeholder="1234 5678 9012"
              inputMode="numeric"
              maxLength={14}
            />
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
              {busy ? "Saving…" : initial ? "Save changes" : "Add customer"}
            </button>
          </div>
        </form>

        <style>{`
          .cust-input {
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
          .cust-input:focus {
            border-color: hsl(var(--turmeric));
            box-shadow: 0 0 0 3px hsl(var(--turmeric) / 0.18);
          }
          textarea.cust-input { height: auto; }
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
