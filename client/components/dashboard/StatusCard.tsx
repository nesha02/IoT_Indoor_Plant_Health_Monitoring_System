import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "cyan";
}

export default function StatusCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatusCardProps) {
  const bgColorClass = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
    cyan: "bg-cyan-50 border-cyan-200",
  }[color];

  return (
    <div
      className={cn(
        "rounded-lg border p-6 bg-white",
        "flex flex-col gap-3 hover:shadow-lg transition-shadow"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
