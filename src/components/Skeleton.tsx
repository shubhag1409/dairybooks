/**
 * Skeleton loaders — shimmer only, never spinners.
 */
import { cn } from "@/lib/utils";

export const Skel = ({ className }: { className?: string }) => (
  <span className={cn("skel", className)} aria-hidden="true" />
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
        <Skel className="h-3 w-24 mb-4" />
        <Skel className="h-8 w-32" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="overflow-hidden border border-border rounded-lg bg-card">
    <div className="bg-forest px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skel key={i} className="skel-light h-3 w-20 bg-forest-l" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="px-4 py-3.5 grid gap-4 border-t border-border-l"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <Skel key={c} className={cn("h-3", c === 0 ? "w-32" : "w-20")} />
        ))}
      </div>
    ))}
  </div>
);

export const CustomerGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-card">
        <Skel className="h-4 w-32 mb-2" />
        <Skel className="h-3 w-24 mb-3" />
        <Skel className="h-5 w-16" />
      </div>
    ))}
  </div>
);
