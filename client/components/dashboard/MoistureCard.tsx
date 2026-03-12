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

  const getMoistureColor = (value: number) => {
    if (value < 45) return "bg-red-500";
    if (value > 85) return "bg-blue-500";
    return "bg-primary";
  };

  const status = getMoistureStatus(moisture);
  const statusColor = status === "Dry" ? "text-red-600" : status === "Over-wet" ? "text-blue-600" : "text-primary";

  return (
    <div className="rounded-lg border p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Soil Moisture
        </h3>
        <Droplets className="w-8 h-8 text-primary" />
      </div>

      <p className="text-2xl font-bold text-foreground mb-4">{moisture}%</p>

      <p className={cn("text-xs font-medium mb-4", statusColor)}>
        Status: {status}
      </p>

      {/* Range bar with zones */}
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
        {/* Dry zone - 0-45 */}
        <div className="absolute left-0 top-0 h-full w-[45%] bg-red-500 opacity-30"></div>
        {/* Safe zone - 45-85 */}
        <div className="absolute left-[45%] top-0 h-full w-[40%] bg-primary opacity-30"></div>
        {/* Over-wet zone - 85-100 */}
        <div className="absolute right-0 top-0 h-full w-[15%] bg-blue-500 opacity-30"></div>

        {/* Current value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-gray-800 transition-all"
          style={{ left: `${Math.max(2, Math.min(98, moisture))}%` }}
        ></div>
      </div>

      <div className="flex text-xs text-muted-foreground">
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
          Dry &lt;45%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1"></span>
          Safe 50–80%
        </span>
        <span className="flex-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
          Over-wet &gt;85%
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
