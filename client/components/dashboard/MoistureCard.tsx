import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";


interface MoistureCardProps {
  moisture: number;
  thresholds: {
    dry: number;
    safe: number;
    overwet: number;
  };
}

export default function MoistureCard({ moisture, thresholds }: MoistureCardProps) {
  const getMoistureStatus = (value: number) => {
    if (value < thresholds.dry) return "Dry";
    if (value > thresholds.overwet) return "Over-wet";
    return "Safe";
  };

  const status = getMoistureStatus(moisture);
  const statusColor = status === "Dry" ? "text-zone-dry" : status === "Over-wet" ? "text-zone-over-wet" : "text-zone-safe";

  // Calculate indicator position as a percentage of the bar (0-100%)
  const indicatorPosition = Math.max(2, Math.min(98, (moisture / 100) * 100));

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




      {/* Range bar with zones using dynamic thresholds */}
      <div className="relative h-8 bg-ui-bg-secondary rounded-full overflow-hidden mb-3">
        {/* Dry zone */}
        <div
          className="absolute left-0 top-0 h-full bg-zone-dry-bg"
          style={{ width: `${thresholds.dry}%` }}
        ></div>
        {/* Safe zone */}
        <div
          className="absolute top-0 h-full bg-zone-safe-bg"
          style={{ left: `${thresholds.dry}%`, width: `${Math.max(0, thresholds.safe - thresholds.dry)}%` }}
        ></div>
        {/* Over-wet zone */}
        <div
          className="absolute top-0 h-full bg-zone-over-wet-bg"
          style={{ left: `${thresholds.safe}%`, width: `${Math.max(0, thresholds.overwet - thresholds.safe)}%` }}
        ></div>
        {/* Beyond overwet zone (100%) */}
        <div
          className="absolute top-0 right-0 h-full bg-zone-over-wet-bg"
          style={{ left: `${thresholds.overwet}%`, width: `${Math.max(0, 100 - thresholds.overwet)}%` }}
        ></div>

        {/* Current value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-ui-text-primary transition-all"
          style={{ left: `${indicatorPosition}%` }}
        ></div>
      </div>

      <div className="flex text-xs text-ui-text-muted">
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-dry mr-1"></span>
          Dry &lt;{thresholds.dry}%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-safe mr-1"></span>
          Safe {thresholds.dry}–{thresholds.overwet}%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-zone-over-wet mr-1"></span>
          Over-wet &gt;{thresholds.overwet}%
        </span>
      </div>
    </div>
  );
}
