import { useEffect, useState } from "react";
import { Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, showApiError } from "@/lib/dairy";

type BusinessInfo = {
  business_name: string;
  ca_email: string;
  gst_number: string;
  pan_number: string;
  email: string;
  phone: string;
  address: string;
  bank_account_number: string;
  ifsc_code: string;
};

const empty: BusinessInfo = {
  business_name: "",
  ca_email: "",
  gst_number: "",
  pan_number: "",
  email: "",
  phone: "",
  address: "",
  bank_account_number: "",
  ifsc_code: "",
};

export default function Settings() {
  const [info, setInfo] = useState<BusinessInfo>(empty);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("business_name,ca_email,gst_number,pan_number,email,phone,address,bank_account_number,ifsc_code")
        .maybeSingle();
      showApiError(error, "Could not load settings");
      if (data) {
        setInfo({
          business_name: data.business_name ?? "",
          ca_email: data.ca_email ?? "",
          gst_number: (data as any).gst_number ?? "",
          pan_number: (data as any).pan_number ?? "",
          email: (data as any).email ?? "",
          phone: (data as any).phone ?? "",
          address: (data as any).address ?? "",
          bank_account_number: (data as any).bank_account_number ?? "",
          ifsc_code: (data as any).ifsc_code ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof BusinessInfo>(k: K, v: string) => setInfo((p) => ({ ...p, [k]: v }));

  const validate = (): string | null => {
    if (info.email && !/^\S+@\S+\.\S+$/.test(info.email.trim())) return "Enter a valid business email.";
    if (info.ca_email && !/^\S+@\S+\.\S+$/.test(info.ca_email.trim())) return "Enter a valid CA email.";
    if (info.phone && !/^[+\d\s-]{7,20}$/.test(info.phone.trim())) return "Enter a valid phone number.";
    if (info.gst_number && info.gst_number.trim().length > 20) return "GST number is too long.";
    if (info.pan_number && info.pan_number.trim().length > 15) return "PAN number is too long.";
    if (info.ifsc_code && info.ifsc_code.trim().length > 15) return "IFSC code is too long.";
    if (info.bank_account_number && info.bank_account_number.trim().length > 30) return "Bank account number is too long.";
    if (info.business_name && info.business_name.trim().length > 120) return "Business name is too long.";
    if (info.address && info.address.trim().length > 500) return "Address is too long.";
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const userId = await getUserId();
      const payload: any = {
        user_id: userId,
        business_name: info.business_name.trim() || null,
        ca_email: info.ca_email.trim() || null,
        gst_number: info.gst_number.trim() || null,
        pan_number: info.pan_number.trim().toUpperCase() || null,
        email: info.email.trim() || null,
        phone: info.phone.trim() || null,
        address: info.address.trim() || null,
        bank_account_number: info.bank_account_number.trim() || null,
        ifsc_code: info.ifsc_code.trim().toUpperCase() || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("business_settings").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Business details saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Business details used in invoices, ledger and monthly reports." />

      <section className="bg-card border border-border rounded-lg shadow-card p-6 max-w-3xl">
        <header className="flex items-center gap-2 mb-5">
          <span className="h-9 w-9 rounded-md bg-forest/10 text-forest grid place-items-center">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Business information</h2>
            <p className="text-xs text-ink-2">These details appear on invoices, payment requests and reports.</p>
          </div>
        </header>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className="skel h-10 w-full" />)}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company name">
                <input value={info.business_name} onChange={(e) => set("business_name", e.target.value)} className="input" placeholder="Shubham Dairy Distributors" maxLength={120} />
              </Field>
              <Field label="GST number">
                <input value={info.gst_number} onChange={(e) => set("gst_number", e.target.value.toUpperCase())} className="input" placeholder="22AAAAA0000A1Z5" maxLength={20} />
              </Field>
              <Field label="PAN number">
                <input value={info.pan_number} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} className="input" placeholder="ABCDE1234F" maxLength={15} />
              </Field>
              <Field label="Phone number">
                <input value={info.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+91 98765 43210" maxLength={20} />
              </Field>
              <Field label="Business email">
                <input value={info.email} onChange={(e) => set("email", e.target.value)} className="input" type="email" placeholder="business@example.com" maxLength={255} />
              </Field>
              <Field label="CA email">
                <input value={info.ca_email} onChange={(e) => set("ca_email", e.target.value)} className="input" type="email" placeholder="ca@example.com" maxLength={255} />
              </Field>
            </div>

            <Field label="Address">
              <textarea value={info.address} onChange={(e) => set("address", e.target.value)} className="input min-h-[88px] py-2 leading-relaxed" placeholder="Shop / building, street, city, state, PIN" maxLength={500} />
            </Field>

            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Bank details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Bank account number">
                  <input value={info.bank_account_number} onChange={(e) => set("bank_account_number", e.target.value.replace(/\s+/g, ""))} className="input" placeholder="00000000000000" maxLength={30} />
                </Field>
                <Field label="IFSC code">
                  <input value={info.ifsc_code} onChange={(e) => set("ifsc_code", e.target.value.toUpperCase())} className="input" placeholder="HDFC0001234" maxLength={15} />
                </Field>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={save} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                {busy ? "Saving…" : "Save business details"}
              </button>
            </div>
          </div>
        )}
      </section>

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

const inputCss = `.input{width:100%;height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}textarea.input{height:auto}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;