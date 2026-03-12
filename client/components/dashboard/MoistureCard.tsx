import { Droplets } from "lucide-react";

interface MoistureCardProps {
  moisture: number;
}

export default function MoistureCard({ moisture }: MoistureCardProps) {
  const getMoistureStatus = (value: number) => {
    if (value < 45) return "Dry";
    if (value > 85) return "Over-wet";
    return "Safe";
  };

  const status = getMoistureStatus(moisture);
  const statusColor = status === "Dry" ? "text-zone-dry" : status === "Over-wet" ? "text-zone-over-wet" : "text-zone-safe";

  return (
    <div className="rounded-lg border border-ui-border p-6 bg-ui-bg-card hover:shadow-lg hover:border-ui-border transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-ui-text-secondary">
          Soil Moisture
        </h3>
        <div className="rounded-lg p-2 bg-ui-bg-secondary">
          <Droplets className="w-6 h-6 text-sensor-moisture" />
        </div>
      </div>

      <p className="text-2xl font-bold text-ui-text-primary mb-4">{moisture}%</p>

      <p className={cn("text-xs font-medium mb-4", statusColor)}>
        Status: {status}
      </p>

      {/* Range bar with zones */}
      <div className="relative h-8 bg-ui-bg-secondary rounded-full overflow-hidden mb-3">
        {/* Dry zone - 0-45 */}
        <div className="absolute left-0 top-0 h-full w-[45%] bg-zone-dry-bg"></div>
        {/* Safe zone - 45-85 */}
        <div className="absolute left-[45%] top-0 h-full w-[40%] bg-zone-safe-bg"></div>
        {/* Over-wet zone - 85-100 */}
        <div className="absolute right-0 top-0 h-full w-[15%] bg-zone-over-wet-bg"></div>

        {/* Current value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-ui-text-primary transition-all"
          style={{ left: `${Math.max(2, Math.min(98, moisture))}%` }}
        ></div>
      </div>

      <div className="flex text-xs text-ui-text-muted">
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-dry mr-1"></span>
          Dry &lt;45%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-safe mr-1"></span>
          Safe 50–80%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-over-wet mr-1"></span>
          Over-wet &gt;85%
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
