import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface AdvancedAnalyticsProps {
  data: {
    irrigationImpact: {
      amount: number;
      previousMoisture: number;
      currentMoisture: number;
      moistureIncrease: number;
    };
    analytics: {
      dropRate: number;
      avgWaterPerEvent: number;
      weeklyUsage: number;
    };
  };
}

export default function AdvancedAnalytics({
  data,
}: AdvancedAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-ui-border bg-ui-bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 hover:bg-ui-bg-secondary transition-colors cursor-pointer">
            <h2 className="text-lg font-bold text-ui-text-primary">
              Advanced Analytics
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-ui-text-muted transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-ui-border">
          <div className="p-6 space-y-4">
            {/* Irrigation Impact Card */}
            <div className="rounded-lg border border-green-primary/30 bg-gradient-to-br from-green-bg-soft to-transparent p-4 mb-4">
              <h3 className="text-sm font-semibold text-ui-text-primary mb-3">
                Last Irrigation Impact
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">
                    Water Delivered
                  </span>
                  <span className="font-semibold text-ui-text-primary">
                    {data.irrigationImpact.amount} mL
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">
                    Moisture Before
                  </span>
                  <span className="font-semibold text-ui-text-primary">
                    {data.irrigationImpact.previousMoisture}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">
                    Moisture After
                  </span>
                  <span className="font-semibold text-ui-text-primary">
                    {data.irrigationImpact.currentMoisture}%
                  </span>
                </div>
                <div className="pt-2 border-t border-green-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ui-text-primary">
                      Moisture Increase
                    </span>
                    <span className="font-bold text-green-primary text-lg">
                      +{data.irrigationImpact.moistureIncrease}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-ui-border bg-ui-bg-secondary p-4">
                <p className="text-xs text-ui-text-muted mb-2">
                  Moisture Drop Rate
                </p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {data.analytics.dropRate}%
                </p>
                <p className="text-xs text-ui-text-muted mt-1">per hour</p>
              </div>

              <div className="rounded-lg border border-ui-border bg-ui-bg-secondary p-4">
                <p className="text-xs text-ui-text-muted mb-2">
                  Average Water per Event
                </p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {data.analytics.avgWaterPerEvent} mL
                </p>
              </div>

              <div className="rounded-lg border border-ui-border bg-ui-bg-secondary p-4">
                <p className="text-xs text-ui-text-muted mb-2">
                  Weekly Water Usage
                </p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {data.analytics.weeklyUsage} mL
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
