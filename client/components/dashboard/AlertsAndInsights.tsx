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
      <div className="rounded-lg border border-ui-border bg-ui-bg-card p-6">
        <h2 className="text-lg font-bold text-ui-text-primary mb-4">Alerts</h2>
        <div className="space-y-3">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border flex items-start gap-3 ${
                alert.active
                  ? alert.type === "dry"
                    ? "bg-red-bg-soft border-red-critical/40"
                    : "bg-amber-soft border-amber-warning/40"
                  : "bg-ui-bg-secondary border-ui-border opacity-60"
              }`}
            >
              {alert.type === "dry" ? (
                <AlertCircle className="w-5 h-5 text-red-critical flex-shrink-0 mt-0.5" />
              ) : alert.type === "over" ? (
                <AlertTriangle className="w-5 h-5 text-amber-warning flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-warning flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm ${
                  alert.active
                    ? alert.type === "dry"
                      ? "text-red-critical font-medium"
                      : "text-amber-warning font-medium"
                    : "text-ui-text-muted"
                }`}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ML Insights Panel */}
      <div className="rounded-lg border border-ui-border bg-gradient-to-br from-blue-bg-soft to-purple-bg-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-primary" />
          <h2 className="text-lg font-bold text-ui-text-primary">ML Insights</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-ui-bg-card rounded-lg p-3 border border-ui-border">
              <p className="text-xs text-ui-text-muted mb-1">
                Watering Required
              </p>
              <p className="text-lg font-bold text-ui-text-primary">
                {data.mlInsights.wateringRequired ? "YES" : "NO"}
              </p>
            </div>
            <div className="bg-ui-bg-card rounded-lg p-3 border border-ui-border">
              <p className="text-xs text-ui-text-muted mb-1">Confidence</p>
              <p className="text-lg font-bold text-blue-primary">
                {data.mlInsights.confidence}%
              </p>
            </div>
          </div>

          <div className="bg-ui-bg-card rounded-lg p-3 border border-ui-border">
            <p className="text-xs text-ui-text-muted mb-1">
              Est. Next Watering Time
            </p>
            <p className="text-base font-semibold text-ui-text-primary">
              {data.mlInsights.nextWateringTime}
            </p>
          </div>

          <div className="bg-ui-bg-card rounded-lg p-3 border border-ui-border">
            <p className="text-xs text-ui-text-muted mb-1">Key Insight</p>
            <p className="text-sm text-ui-text-primary">
              {data.mlInsights.insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
