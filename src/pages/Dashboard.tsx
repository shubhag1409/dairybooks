/**
 * Dashboard — greeting, monthly stats row, quick links.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { StatsSkeleton } from "@/components/Skeleton";

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

const monthRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
};

const QUICK = [
  { to: "/purchases", icon: "📦", title: "Purchase Tracking", desc: "Log what you bought from the company today." },
  { to: "/sales", icon: "🧾", title: "Sales Tracking", desc: "Bill each customer route-by-route." },
  { to: "/crates", icon: "🟩", title: "Crate Management", desc: "Reconcile crates received and given." },
  { to: "/reports", icon: "📊", title: "Reports & Export", desc: "Download or email a monthly Excel report." },
];

type Stats = { products: number; customers: number; purchases: number; sales: number };

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { start, end } = monthRange();
      const [{ count: products }, { count: customers }, purchases, sales, purchaseAgg, saleAgg] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("purchases").select("id").gte("date", start).lt("date", end),
        supabase.from("sales").select("id").gte("date", start).lt("date", end),
        supabase
          .from("purchase_items")
          .select("price,purchase_id"),
        supabase
          .from("sale_items")
          .select("amount,sale_id"),
      ]);
      if (!alive) return;
      const purchaseIds = new Set((purchases.data ?? []).map((p: any) => p.id));
      const saleIds = new Set((sales.data ?? []).map((s: any) => s.id));
      const purchaseTotal = (purchaseAgg.data ?? []).filter((r: any) => purchaseIds.has(r.purchase_id)).reduce((s: number, r: any) => s + Number(r.price || 0), 0);
      const salesTotal = (saleAgg.data ?? []).filter((r: any) => saleIds.has(r.sale_id)).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      setStats({
        products: products ?? 0,
        customers: customers ?? 0,
        purchases: purchaseTotal,
        sales: salesTotal,
      });
    })();
    return () => { alive = false; };
  }, []);

  const cards = stats && [
    { label: "Products", value: stats.products.toString(), hint: "in your catalogue" },
    { label: "Customers", value: stats.customers.toString(), hint: "active shops" },
    { label: "Purchases · this month", value: `₹${inr(stats.purchases)}`, hint: "from company" },
    { label: "Sales · this month", value: `₹${inr(stats.sales)}`, hint: "billed to customers" },
  ];

  return (
    <>
      <PageHeader title={`${greet()}.`} subtitle={today} />

      <section className="mb-10">
        {!stats ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards!.map((c) => (
              <div key={c.label} className="stat-card bg-card border border-border rounded-lg p-5 shadow-card">
                <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">{c.label}</div>
                <div className="font-tabular text-[30px] leading-tight text-ink mt-3">{c.value}</div>
                <div className="text-[12px] text-ink-4 mt-1">{c.hint}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl text-ink mb-4">Jump back in</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="lift bg-card border border-border rounded-lg p-5 shadow-card flex items-start gap-4 hover:border-turmeric/40"
            >
              <div className="h-11 w-11 rounded-md bg-cream-d flex items-center justify-center text-xl shrink-0">
                {q.icon}
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg text-ink leading-tight">{q.title}</div>
                <div className="text-sm text-ink-3 mt-1">{q.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
