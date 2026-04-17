import { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="font-display text-3xl sm:text-[34px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-ink-3 text-sm mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
