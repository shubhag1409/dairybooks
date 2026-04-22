import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/dairy";

export default function Settings() {
  const [businessName, setBusinessName] = useState("");
  const [caEmail, setCaEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("business_settings").select("business_name,ca_email").maybeSingle();
      if (error) toast.error(error.message);
      setBusinessName(data?.business_name ?? "");
      setCaEmail(data?.ca_email ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("business_settings").upsert({ user_id: userId, business_name: businessName.trim() || null, ca_email: caEmail.trim() || null, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (err: any) { toast.error(err?.message ?? "Could not save settings"); } finally { setBusy(false); }
  };

  return <><PageHeader title="Settings" subtitle="Business details used in monthly reports." /><section className="bg-card border border-border rounded-lg shadow-card p-6 max-w-xl">{loading ? <div className="space-y-4"><span className="skel h-10 w-full" /><span className="skel h-10 w-full" /></div> : <div className="space-y-4"><Field label="Business name"><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" placeholder="e.g. Shubham Dairy Distributors" /></Field><Field label="CA email"><input value={caEmail} onChange={(e) => setCaEmail(e.target.value)} className="input" type="email" placeholder="ca@example.com" /></Field><button onClick={save} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center gap-2"><Save className="h-4 w-4" />{busy ? "Saving…" : "Save settings"}</button></div>}</section><style>{inputCss}</style></>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-ink-2">{label}<div className="mt-1.5">{children}</div></label>; }
const inputCss = `.input{width:100%;height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
