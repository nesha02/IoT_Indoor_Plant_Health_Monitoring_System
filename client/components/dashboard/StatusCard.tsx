import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  accentColor?: string;
}

export default function StatusCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
}: StatusCardProps) {

  return (
    <div
      className={cn(
        "rounded-lg border p-6 bg-white",
        "flex flex-col gap-3 hover:shadow-lg hover:border-ui-border transition-all"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ui-text-secondary">{title}</h3>
        <div className="rounded-lg p-2 bg-ui-bg-secondary">{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-ui-text-primary">{value}</p>
        {subtitle && (
          <p className="text-xs text-ui-text-muted mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
