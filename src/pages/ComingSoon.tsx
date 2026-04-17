/**
 * Placeholder page for modules being built in Phase 2.
 * Same Fresh Ledger styling so navigation feels complete.
 */
import PageHeader from "@/components/PageHeader";

export default function ComingSoon({
  title,
  subtitle,
  icon,
  blurb,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  blurb: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="bg-card border border-border rounded-lg shadow-card p-10 sm:p-14 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-cream-d flex items-center justify-center text-3xl mb-5">
          {icon}
        </div>
        <h3 className="font-display text-2xl text-ink mb-2">Coming up next</h3>
        <p className="text-ink-3 text-sm max-w-md mx-auto leading-relaxed">{blurb}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-turmeric font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-turmeric" /> Phase 2
        </div>
      </div>
    </>
  );
}
