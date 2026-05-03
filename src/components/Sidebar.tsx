/**
 * DairyBook sidebar — forest green, turmeric active indicator.
 * Fixed 236px on desktop; collapses to a top bar with menu button on mobile.
 */
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: "🏠", end: true }],
  },
  {
    section: "Tracking",
    items: [
      { to: "/purchases", label: "Purchase Tracking", icon: "📦" },
      { to: "/sales", label: "Sales Tracking", icon: "🧾" },
      { to: "/crates", label: "Crate Management", icon: "🟩" },
      { to: "/ledger", label: "Customer Ledger", icon: "📒" },
      { to: "/expenses", label: "Expenses", icon: "💸" },
      { to: "/inventory", label: "Inventory", icon: "📋" },
    ],
  },
  {
    section: "Master Data",
    items: [
      { to: "/products", label: "Products", icon: "🥛" },
      { to: "/customers", label: "Customers", icon: "👥" },
    ],
  },
  {
    section: "Reports",
    items: [
      { to: "/reports", label: "Reports & Export", icon: "📊" },
      { to: "/settings", label: "Settings", icon: "⚙️" },
    ],
  },
] as const;

const Item = ({ to, label, icon, end }: { to: string; label: string; icon: string; end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        "relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-[14px] font-medium transition-colors press",
        "text-cream/75 hover:text-cream hover:bg-forest-l/60",
        isActive && "text-turmeric-l bg-forest-l/40"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-turmeric" aria-hidden />
        )}
        <span className="text-base leading-none" aria-hidden>{icon}</span>
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const Body = (
    <aside className="w-[236px] shrink-0 bg-forest text-cream h-screen sticky top-0 flex flex-col border-r border-forest-xl/40">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-forest-xl/40">
        <span className="text-2xl" aria-hidden>🐄</span>
        <div>
          <div className="font-display text-[22px] leading-none text-cream">DairyBook</div>
          <div className="text-[11px] text-cream/60 mt-1">Distributor Ledger</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((group) => (
          <div key={group.section} className="mb-3">
            <div className="px-5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-cream/45 uppercase">
              {group.section}
            </div>
            <div className="flex flex-col">
              {group.items.map((it) => (
                <Item key={it.to} {...it} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-forest-xl/40 space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 text-[13px] text-cream/70 hover:text-cream transition-colors px-2 py-1.5 rounded press"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <p className="text-[10.5px] text-cream/45 leading-relaxed px-1">
          Your data is private and isolated to your account.
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{Body}</div>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-forest text-cream flex items-center justify-between px-4 h-14 border-b border-forest-xl/40">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>🐄</span>
          <span className="font-display text-lg">DairyBook</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded hover:bg-forest-l press"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative animate-in slide-in-from-left duration-200">
            {Body}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-cream p-2 rounded hover:bg-forest-l press"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
