import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCardsRow from "@/components/dashboard/StatusCardsRow";
import MoistureChartRow from "@/components/dashboard/MoistureChartRow";
import AlertsAndInsights from "@/components/dashboard/AlertsAndInsights";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [selectedPlant, setSelectedPlant] = useState<
    "PLANT_01" | "PLANT_02" | "PLANT_03"
  >("PLANT_01");
  const [plantData, setPlantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Map dashboard plant keys to API plant IDs
  const plantIdMap: Record<string, string> = {
    PLANT_01: "plant1",
    PLANT_02: "plant2",
    PLANT_03: "plant3",
  };

  useEffect(() => {
    async function fetchAllPlantData() {
      setLoading(true);
      setError(null);
      try {
        const id = plantIdMap[selectedPlant];
        const [liveRes, historyRes, analyticsRes, waterRes] = await Promise.all([
          fetch(`/api/plant/${id}/live`),
          fetch(`/api/plant/${id}/history`),
          fetch(`/api/plant/${id}/analytics`),
          fetch(`/api/plant/${id}/water-analytics`),
        ]);
        if (!liveRes.ok || !historyRes.ok || !analyticsRes.ok || !waterRes.ok) {
          throw new Error("Failed to fetch one or more endpoints");
        }
        const [live, history, analytics, water] = await Promise.all([
          liveRes.json(),
          historyRes.json(),
          analyticsRes.json(),
          waterRes.json(),
        ]);

        setPlantData({
          // Live
          moisture: live.soil_pct,
          light: live.light,
          temperature: live.temperature,
          humidity: live.humidity,
          pumpStatus: live.pump_status,
          lastWatered: live.last_updated ? new Date(live.last_updated).toLocaleTimeString() : "-",
          lastWaterAmount: live.water_delivered,
          lastUpdate: live.last_updated ? new Date(live.last_updated).toLocaleTimeString() : "-",
          // History for chart
          moistureHistory: history.history.map((d: any) => ({
            time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: d.soil,
          })),
          // Force the dry alert to be active for demo/testing
          alerts: [
            {
              type: "dry",
              message: "Dry soil – watering required",
              active: true, // <-- Always show this alert
            },
            {
              type: "over",
              message: "Over-watering risk",
              active: false,
            },
            {
              type: "sensor",
              message: "Sensor offline",
              active: false,
            },
          ],
          // ML Insights
          mlInsights: {
            wateringRequired: analytics.prediction === "Water Needed",
            confidence: Math.round((analytics.confidence ?? 0) * 100),
            nextWateringTime: analytics.estimated_next_watering
              ? new Date(analytics.estimated_next_watering).toLocaleString()
              : "Unknown",
            insight: analytics.insight,
          },
          // Advanced Analytics
          irrigationImpact: {
            amount: water.last_event?.water_delivered ?? 0,
            previousMoisture: water.last_event?.soil_before ?? 0,
            currentMoisture: water.last_event?.soil_after ?? 0,
            moistureIncrease:
              (water.last_event?.soil_after ?? 0) -
              (water.last_event?.soil_before ?? 0),
          },
          analytics: {
            dropRate: analytics.drop_rate ?? 0,
            avgWaterPerEvent: water.avg_water_per_event ?? 0,
            weeklyUsage: water.weekly_total ?? 0,
          },
        });
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAllPlantData();
  }, [selectedPlant]);

  // Show popup for each active alert, with color and top-center position
  useEffect(() => {
    if (!plantData) return;
    plantData.alerts?.forEach((alert: any) => {
      if (alert.active) {
        toast({
          title: "Plant Alert",
          description: alert.message,
          style: {
            backgroundColor: '#f87171', // red-400
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center',
          },
          position: 'top-center', // If your toast system supports this
        });
      }
    });
  }, [plantData, toast]);

  return (
    <div className="min-h-screen bg-ui-bg-main">
      <DashboardHeader
        selectedPlant={selectedPlant}
        onPlantChange={setSelectedPlant}
        plants={{
          PLANT_01: { name: "Snake Plant" },
          PLANT_02: { name: "Money Plant" },
          PLANT_03: { name: "Cactus" },
        }}
        lastUpdate={plantData?.lastUpdate || "-"}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : plantData ? (
          <>
            <StatusCardsRow data={plantData} />
            <MoistureChartRow data={plantData} />
            <AlertsAndInsights data={plantData} />
            <AdvancedAnalytics data={plantData} />
          </>
        ) : (
          <div>No data available.</div>
        )}
      </main>
    </div>
  );
}