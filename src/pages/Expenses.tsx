import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, showApiError, todayISO } from "@/lib/dairy";

type Expense = { id: string; date: string; category: string; description: string | null; amount: number };

const DEFAULT_CATEGORIES = ["Petrol", "Diesel", "Salary", "Rent", "Electricity", "Repairs", "Food", "Other"];

export default function Expenses() {
  const [date, setDate] = useState(todayISO());
  const [filterDate, setFilterDate] = useState(todayISO());
  const [category, setCategory] = useState("Petrol");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<Expense[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("id,date,category,description,amount")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    showApiError(error, "Could not load expenses");
    setItems((data as Expense[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (items ?? []).filter((e) => e.date === filterDate),
    [items, filterDate]
  );
  const totalForDay = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filtered]
  );
  const allCategories = useMemo(() => {
    const used = new Set<string>(DEFAULT_CATEGORIES);
    (items ?? []).forEach((e) => e.category && used.add(e.category));
    return Array.from(used);
  }, [items]);

  const save = async () => {
    const finalCategory = (category === "__new__" ? customCategory : category).trim();
    const amt = Number(amount);
    if (!finalCategory) return toast.error("Enter a category");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        date,
        category: finalCategory,
        description: description.trim() || null,
        amount: amt,
      });
      if (error) throw error;
      toast.success("Expense saved");
      setAmount("");
      setDescription("");
      if (category === "__new__") {
        setCategory(finalCategory);
        setCustomCategory("");
      }
      load();
    } catch (err: any) {
      safeErrorToast(err, "Could not save expense");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return safeErrorToast(error, "Operation failed");
    toast.success("Expense deleted");
    load();
  };

  return (
    <>
      <PageHeader title="Business Expenses" subtitle="Log daily business expenses and view totals by date." />
      <div className="grid lg:grid-cols-[420px_1fr] gap-4 sm:gap-5">
        {/* Add expense form */}
        <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 h-fit">
          <div className="space-y-4">
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ Add new category…</option>
              </select>
            </Field>
            {category === "__new__" && (
              <Field label="New category name">
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Maintenance"
                  className="input"
                />
              </Field>
            )}
            <Field label="Description (optional)">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Bike refill at HP pump"
                className="input"
              />
            </Field>
            <Field label="Amount (₹)">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="0"
                className="input font-tabular"
              />
            </Field>
            <button
              onClick={save}
              disabled={busy}
              className="w-full h-10 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {busy ? "Saving…" : "Add expense"}
            </button>
          </div>
        </section>

        {/* Expense list for selected date */}
        <section className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border-l flex flex-wrap items-end gap-3 justify-between">
            <Field label="Show expenses for">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input"
              />
            </Field>
            <div className="rounded-lg bg-cream-d px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">Total ({filtered.length} item{filtered.length === 1 ? "" : "s"})</div>
              <div className="font-tabular text-2xl text-ink">₹ {totalForDay.toFixed(2)}</div>
            </div>
          </div>

          {items === null ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-3">No expenses recorded for this date.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="bg-forest text-cream">
                  <tr>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border-l">
                      <Td className="font-medium text-ink">{r.category}</Td>
                      <Td>{r.description || <span className="text-ink-3">—</span>}</Td>
                      <Td className="text-right font-tabular">₹ {Number(r.amount).toFixed(2)}</Td>
                      <Td className="text-right">
                        <button
                          onClick={() => remove(r.id)}
                          className="h-8 w-8 rounded hover:bg-cream-d text-ink-3 hover:text-danger inline-flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-cream-d/40">
                    <Td className="font-semibold text-ink" >Total</Td>
                    <Td />
                    <Td className="text-right font-tabular font-semibold text-ink">₹ {totalForDay.toFixed(2)}</Td>
                    <Td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
      <style>{inputCss}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-ink-2">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
const Th = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3.5 text-sm text-ink-2 ${className}`}>{children}</td>
);
const inputCss = `.input{width:100%;height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;