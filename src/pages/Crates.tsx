import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, showApiError, todayISO } from "@/lib/dairy";

type Crate = { id: string; date: string; opening_stock: number; received: number; given: number; closing_stock: number };

export default function Crates() {
  const [date, setDate] = useState(todayISO());
  const [opening, setOpening] = useState("0");
  const [received, setReceived] = useState("0");
  const [given, setGiven] = useState("0");
  const [items, setItems] = useState<Crate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const closing = useMemo(() => (Number(opening) || 0) + (Number(received) || 0) - (Number(given) || 0), [opening, received, given]);

  const load = async () => {
    const { data, error } = await supabase.from("crates").select("id,date,opening_stock,received,given,closing_stock").order("date", { ascending: false }).limit(60);
    showApiError(error, "Could not load crate data");
    const rows = (data as Crate[]) ?? [];
    setItems(rows);
    const latest = rows[0];
    if (latest && date === todayISO()) setOpening(String(latest.closing_stock));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("crates").insert({ date, opening_stock: Number(opening) || 0, received: Number(received) || 0, given: Number(given) || 0, closing_stock: closing, user_id: userId });
      if (error) throw error;
      toast.success("Crate entry saved");
      setReceived("0");
      setGiven("0");
      load();
    } catch (err: any) { toast.error(err?.message ?? "Could not save crates"); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this crate entry?")) return;
    const { error } = await supabase.from("crates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Crate entry deleted");
    load();
  };

  return <><PageHeader title="Crate Management" subtitle="Opening + received − given = closing stock." /><div className="grid lg:grid-cols-[420px_1fr] gap-4 sm:gap-5"><section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 h-fit"><div className="space-y-4"><Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></Field><div className="grid grid-cols-3 gap-2 sm:gap-3"><Field label="Opening"><input value={opening} onChange={(e) => setOpening(e.target.value)} type="number" inputMode="numeric" className="input font-tabular" /></Field><Field label="Received"><input value={received} onChange={(e) => setReceived(e.target.value)} type="number" inputMode="numeric" className="input font-tabular" /></Field><Field label="Given"><input value={given} onChange={(e) => setGiven(e.target.value)} type="number" inputMode="numeric" className="input font-tabular" /></Field></div><div className="rounded-lg bg-cream-d p-4"><div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">Closing stock</div><div className="font-tabular text-3xl text-ink">{closing}</div></div><button onClick={save} disabled={busy} className="w-full h-10 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center justify-center gap-2"><Save className="h-4 w-4" />{busy ? "Saving…" : "Save crate entry"}</button></div></section><section className="bg-card border border-border rounded-lg shadow-card overflow-hidden">{items === null ? <TableSkeleton rows={6} cols={5} /> : <div className="overflow-x-auto"><table className="w-full min-w-[520px]"><thead className="bg-forest text-cream"><tr><Th>Date</Th><Th className="text-right">Opening</Th><Th className="text-right">Received</Th><Th className="text-right">Given</Th><Th className="text-right">Closing</Th><Th className="w-16" /></tr></thead><tbody>{items.map((r) => <tr key={r.id} className="border-t border-border-l"><Td>{r.date}</Td><Td className="text-right font-tabular">{r.opening_stock}</Td><Td className="text-right font-tabular">{r.received}</Td><Td className="text-right font-tabular">{r.given}</Td><Td className="text-right font-tabular font-medium text-ink">{r.closing_stock}</Td><Td className="text-right"><button onClick={() => remove(r.id)} className="h-8 w-8 rounded hover:bg-cream-d text-ink-3 hover:text-danger inline-flex items-center justify-center"><Trash2 className="h-4 w-4" /></button></Td></tr>)}</tbody></table></div>}</section></div><style>{inputCss}</style></>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-ink-2">{label}<div className="mt-1.5">{children}</div></label>; }
const Th = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3.5 text-sm text-ink-2 ${className}`}>{children}</td>;
const inputCss = `.input{width:100%;height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
