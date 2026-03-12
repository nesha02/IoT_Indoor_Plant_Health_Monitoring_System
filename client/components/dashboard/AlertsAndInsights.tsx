import { AlertCircle, AlertTriangle, Zap } from "lucide-react";

interface AlertsAndInsightsProps {
  data: {
    alerts: Array<{ type: string; message: string; active: boolean }>;
    mlInsights: {
      wateringRequired: boolean;
      confidence: number;
      nextWateringTime: string;
      insight: string;
    };
  };
}

export default function AlertsAndInsights({
  data,
}: AlertsAndInsightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alerts Panel */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Alerts</h2>
        <div className="space-y-3">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border flex items-start gap-3 ${
                alert.active
                  ? alert.type === "dry"
                    ? "bg-dry-zone-light/20 border-dry-zone/40"
                    : "bg-warning-amber/10 border-warning-amber/30"
                  : "bg-muted/40 border-border opacity-60"
              }`}
            >
              {alert.type === "dry" ? (
                <AlertCircle className="w-5 h-5 text-dry-zone flex-shrink-0 mt-0.5" />
              ) : alert.type === "over" ? (
                <AlertTriangle className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm ${
                  alert.active
                    ? alert.type === "dry"
                      ? "text-dry-zone font-medium"
                      : "text-warning-amber font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ML Insights Panel */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-bold text-foreground">ML Insights</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Watering Required
              </p>
              <p className="text-lg font-bold text-foreground">
                {data.mlInsights.wateringRequired ? "YES" : "NO"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-lg font-bold text-secondary">
                {data.mlInsights.confidence}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Est. Next Watering Time
            </p>
            <p className="text-base font-semibold text-foreground">
              {data.mlInsights.nextWateringTime}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Key Insight</p>
            <p className="text-sm text-foreground">
              {data.mlInsights.insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
