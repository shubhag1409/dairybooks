import { ReactNode } from "react";

export default function EmptyState({
  icon = "✨",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-6 py-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-cream-d flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="font-display text-xl text-ink mb-1.5">{title}</h3>
      {description && <p className="text-ink-3 text-sm max-w-sm mx-auto mb-5">{description}</p>}
      {action}
    </div>
  );
}
