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
    <div className="rounded-lg border bg-white">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <h2 className="text-lg font-bold text-foreground">
              Advanced Analytics
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border">
          <div className="p-6 space-y-4">
            {/* Irrigation Impact Card */}
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Last Irrigation Impact
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Water Delivered
                  </span>
                  <span className="font-semibold text-foreground">
                    {data.irrigationImpact.amount} mL
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Moisture Before
                  </span>
                  <span className="font-semibold text-foreground">
                    {data.irrigationImpact.previousMoisture}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Moisture After
                  </span>
                  <span className="font-semibold text-foreground">
                    {data.irrigationImpact.currentMoisture}%
                  </span>
                </div>
                <div className="pt-2 border-t border-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Moisture Increase
                    </span>
                    <span className="font-bold text-primary text-lg">
                      +{data.irrigationImpact.moistureIncrease}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Moisture Drop Rate
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.analytics.dropRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">per hour</p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Average Water per Event
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.analytics.avgWaterPerEvent} mL
                </p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Weekly Water Usage
                </p>
                <p className="text-2xl font-bold text-foreground">
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
