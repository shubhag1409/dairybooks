import { useEffect, useMemo, useState } from "react";
import { Banknote, Smartphone, Wallet, CalendarRange } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Customer, inr, showApiError, todayISO } from "@/lib/dairy";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";

type PaymentRow = {
  id: string;
  date: string;
  amount: number;
  method: string;
  customer_id: string;
  note: string | null;
  sale_id: string | null;
};

type RangeMode = "all" | "today" | "week" | "month" | "custom";

export default function CashTracking() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [mode, setMode] = useState<RangeMode>("month");
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "online">("all");

  const range = useMemo(() => {
    const now = new Date();
    if (mode === "all") return null;
    if (mode === "today") return { from: todayISO(), to: todayISO() };
    if (mode === "week") return { from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    if (mode === "month") return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") };
    return { from, to };
  }, [mode, from, to]);

  useEffect(() => {
    (async () => {
      setPayments(null);
      let q = supabase.from("sale_payments").select("id,date,amount,method,customer_id,note,sale_id").order("date", { ascending: false });
      if (range) q = q.gte("date", range.from).lte("date", range.to);
      const [{ data: pay, error: pe }, { data: cust, error: ce }] = await Promise.all([
        q,
        supabase.from("customers").select("id,name,phone,address"),
      ]);
      if (showApiError(pe || ce, "Could not load cash tracking")) return;
      const map: Record<string, Customer> = {};
      ((cust as Customer[]) ?? []).forEach((c) => (map[c.id] = c));
      setCustomers(map);
      setPayments((pay as PaymentRow[]) ?? []);
    })();
  }, [range?.from, range?.to, mode]);

  const filtered = useMemo(
    () => (payments ?? []).filter((p) => methodFilter === "all" || p.method === methodFilter),
    [payments, methodFilter],
  );

  const totals = useMemo(() => {
    const cash = (payments ?? []).filter((p) => p.method === "cash").reduce((s, p) => s + Number(p.amount || 0), 0);
    const online = (payments ?? []).filter((p) => p.method === "online").reduce((s, p) => s + Number(p.amount || 0), 0);
    return { cash, online, total: cash + online, count: (payments ?? []).length };
  }, [payments]);

  const byCustomer = useMemo(() => {
    const map = new Map<string, { name: string; cash: number; online: number; total: number; count: number }>();
    (payments ?? []).forEach((p) => {
      const name = customers[p.customer_id]?.name ?? "—";
      const cur = map.get(p.customer_id) ?? { name, cash: 0, online: 0, total: 0, count: 0 };
      const amt = Number(p.amount || 0);
      if (p.method === "online") cur.online += amt;
      else cur.cash += amt;
      cur.total += amt;
      cur.count += 1;
      map.set(p.customer_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [payments, customers]);

  return (
    <>
      <PageHeader title="Cash Tracking" subtitle="See how money is coming into the business — by Cash vs Online — and from which customer." />

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="h-4 w-4 text-ink-3" />
          {(["all", "today", "week", "month", "custom"] as RangeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`h-9 px-3 rounded-md text-sm press border ${
                mode === m ? "bg-forest text-cream border-forest" : "bg-card text-ink border-border hover:bg-cream-d/40"
              }`}
            >
              {m === "all" ? "All time" : m === "today" ? "Today" : m === "week" ? "This week" : m === "month" ? "This month" : "Custom"}
            </button>
          ))}
          {mode === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
              <span className="text-ink-3 text-sm">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {(["all", "cash", "online"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`h-9 px-3 rounded-md text-sm press border capitalize ${
                  methodFilter === m ? "bg-turmeric text-ink border-turmeric" : "bg-card text-ink border-border hover:bg-cream-d/40"
                }`}
              >
                {m === "all" ? "Both" : m}
              </button>
            ))}
          </div>
        </div>
        {range && (
          <div className="mt-3 text-xs text-ink-3">
            Showing payments from <span className="font-medium text-ink">{range.from}</span> to <span className="font-medium text-ink">{range.to}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-5">
        <StatCard icon={<Banknote className="h-5 w-5" />} label="Cash received" value={inr(totals.cash)} tone="forest" />
        <StatCard icon={<Smartphone className="h-5 w-5" />} label="Online received" value={inr(totals.online)} tone="ink" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Total received" value={inr(totals.total)} tone="turmeric" sub={`${totals.count} payment${totals.count === 1 ? "" : "s"}`} />
      </div>

      {payments === null ? (
        <TableSkeleton rows={5} cols={4} />
      ) : payments.length === 0 ? (
        <EmptyState icon="💰" title="No payments in this range" description="Record payments from the Customer Ledger and they'll show up here." />
      ) : (
        <div className="grid xl:grid-cols-[1fr_360px] gap-4 sm:gap-5">
          {/* Payments list */}
          <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5">
            <h2 className="font-display text-lg sm:text-xl text-ink mb-4">All payments</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0 border-y sm:border border-border sm:rounded-lg">
              <table className="w-full min-w-[560px]">
                <thead className="bg-forest text-cream">
                  <tr>
                    <Th>Date</Th>
                    <Th>Customer</Th>
                    <Th>Method</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Note</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-border-l">
                      <Td className="font-tabular whitespace-nowrap">{p.date}</Td>
                      <Td className="font-medium">{customers[p.customer_id]?.name ?? "—"}</Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          p.method === "online" ? "bg-turmeric/20 text-ink" : "bg-forest/15 text-forest"
                        }`}>
                          {p.method === "online" ? <Smartphone className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                          {p.method}
                        </span>
                      </Td>
                      <Td className="text-right font-tabular font-semibold">{inr(Number(p.amount))}</Td>
                      <Td className="text-ink-2 text-xs">{p.note || (p.sale_id ? "Against bill" : "General")}</Td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><Td className="text-center text-ink-3 py-8">No payments match this filter</Td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* By customer */}
          <div className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-5 h-fit">
            <h2 className="font-display text-lg sm:text-xl text-ink mb-4">By customer</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {byCustomer.map((c, i) => (
                <div key={i} className="border border-border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-ink truncate">{c.name}</div>
                    <div className="font-tabular font-semibold text-ink">{inr(c.total)}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-3">
                    <span className="inline-flex items-center gap-1"><Banknote className="h-3 w-3 text-forest" /> {inr(c.cash)}</span>
                    <span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3" /> {inr(c.online)}</span>
                    <span className="ml-auto">{c.count} pmt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{inputCss}</style>
    </>
  );
}

const Th = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={`px-4 py-3 text-sm ${className}`}>{children}</td>
);

const StatCard = ({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "forest" | "ink" | "turmeric" }) => {
  const color = tone === "forest" ? "text-forest" : tone === "turmeric" ? "text-turmeric" : "text-ink";
  const bg = tone === "forest" ? "bg-forest/10" : tone === "turmeric" ? "bg-turmeric/15" : "bg-ink/10";
  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-md grid place-items-center ${bg} ${color}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
        <div className={`font-tabular text-xl sm:text-2xl ${color} truncate`}>{value}</div>
        {sub && <div className="text-[11px] text-ink-3">{sub}</div>}
      </div>
    </div>
  );
};

const inputCss = `.input{height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;