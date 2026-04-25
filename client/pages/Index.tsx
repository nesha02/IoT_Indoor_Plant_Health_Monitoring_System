import { useState, useEffect, useRef } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCardsRow from "@/components/dashboard/StatusCardsRow";
import MoistureChartRow from "@/components/dashboard/MoistureChartRow";
import AlertsAndInsights from "@/components/dashboard/AlertsAndInsights";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import Chatbot from "@/components/dashboard/Chatbot";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [selectedPlant, setSelectedPlant] = useState<
    "PLANT_01" | "PLANT_02" | "PLANT_03"
  >("PLANT_01");
  const [plantData, setPlantData] = useState<any>(null);
  // Cache for estimated next watering time
  const cachedNextWateringRef = useRef<string | null>(null);
  // For live countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // Controls the chatbot open/close from the header button
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const { toast } = useToast();

  // Map dashboard plant keys to API plant IDs
  // Correct mapping: plant1 = Money Plant, plant2 = Snake Plant, plant3 = Cactus
  const plantIdMap: Record<string, string> = {
    PLANT_01: "plant1", // Money Plant
    PLANT_02: "plant2", // Snake Plant
    PLANT_03: "plant3", // Cactus
  };

  // Fetch all data once on mount or plant change
  useEffect(() => {
    let isMounted = true;
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
        if (!isMounted) return;
        // Cache logic for estimated next watering
        if (analytics.estimated_next_watering) {
          if (cachedNextWateringRef.current !== analytics.estimated_next_watering) {
            cachedNextWateringRef.current = analytics.estimated_next_watering;
          }
        }
        setPlantData({
          // Live
          moisture: live.soil_pct,
          light: live.light,
          temperature: live.temperature,
          humidity: live.humidity,
          pumpStatus: live.pump_status,
          lastWatered: water.last_event?.timestamp
            ? new Date(water.last_event.timestamp).toISOString().replace('T', ' ').substring(0, 19)
            : "-",
          lastWaterAmount: live.water_delivered,
          todayWaterTotal: water.today_total ?? 0,
          lastUpdate: live.last_updated ? new Date(live.last_updated).toLocaleTimeString() : "-",
          thresholds: live.thresholds,
          // History for chart
          moistureHistory: history.history.map((d: any) => ({
            time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: d.soil,
          })),
          // Alerts based on thresholds
          alerts: [
            {
              type: "dry",
              message: `Dry soil – watering required (below ${live.thresholds.dry}%)`,
              active: live.soil_pct < live.thresholds.dry,
            },
            {
              type: "over",
              message: `Over-watering risk (above ${live.thresholds.overwet}%)`,
              active: live.soil_pct > live.thresholds.overwet,
            },
            {
              type: "sensor",
              message: "Sensor offline",
              active: live.is_valid === false,
            },
          ],
          // ML Insights
          mlInsights: {
            wateringRequired: analytics.prediction === "Water Needed",
            confidence: Math.round((analytics.confidence ?? 0) * 100),
            nextWateringTime: cachedNextWateringRef.current
              ? new Date(cachedNextWateringRef.current).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
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
        if (!isMounted) return;
        setError(err.message || "Unknown error");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }
    fetchAllPlantData();
    return () => {
      isMounted = false;
    };
  }, [selectedPlant]);

  // Poll only the data every 3 seconds (live, history, analytics, water-analytics)
  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    async function pollPlantData() {
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
        if (!isMounted) return;
        // Cache logic for estimated next watering in polling
        if (analytics.estimated_next_watering) {
          if (cachedNextWateringRef.current !== analytics.estimated_next_watering) {
            cachedNextWateringRef.current = analytics.estimated_next_watering;
          }
        }
        setPlantData(prev => prev ? {
          ...prev,
          // Live
          moisture: live.soil_pct,
          light: live.light,
          temperature: live.temperature,
          humidity: live.humidity,
          pumpStatus: live.pump_status,
          lastWatered: water.last_event?.timestamp
            ? new Date(water.last_event.timestamp).toISOString().replace('T', ' ').substring(0, 19)
            : "-",
          lastWaterAmount: live.water_delivered,
          todayWaterTotal: water.today_total ?? 0,
          lastUpdate: live.last_updated ? new Date(live.last_updated).toLocaleTimeString() : "-",
          thresholds: live.thresholds,
          // History for chart
          moistureHistory: history.history.map((d: any) => ({
            time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: d.soil,
          })),
          // Alerts based on thresholds
          alerts: [
            {
              type: "dry",
              message: `Dry soil – watering required (below ${live.thresholds.dry}%)`,
              active: live.soil_pct < live.thresholds.dry,
            },
            {
              type: "over",
              message: `Over-watering risk (above ${live.thresholds.overwet}%)`,
              active: live.soil_pct > live.thresholds.overwet,
            },
            {
              type: "sensor",
              message: "Sensor offline",
              active: live.is_valid === false,
            },
          ],
          // ML Insights
          mlInsights: {
            wateringRequired: analytics.prediction === "Water Needed",
            confidence: Math.round((analytics.confidence ?? 0) * 100),
            nextWateringTime: (() => {
              if (!cachedNextWateringRef.current) return "Unknown";
              const target = new Date(cachedNextWateringRef.current);
              const diffMs = target.getTime() - now;
              const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
              const hours = Math.floor(diffHrs);
              const minutes = Math.floor((diffHrs - hours) * 60);
              return `${target.toISOString().replace('T', ' ').substring(0, 19)} UTC (in ${hours}h ${minutes}m)`;
            })(),
            insight: analytics.insight,
          },
          // Advanced Analytics (always update with latest backend data)
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
        } : prev);
      } catch (err: any) {
        // Ignore polling errors, don't set error state
      }
    }
    interval = setInterval(pollPlantData, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedPlant]);

  // Show popup for each active alert, with color and top-center position
  useEffect(() => {
    if (!plantData) return;
    plantData.alerts?.forEach((alert: any) => {
      if (alert.active) {
        let bg = '#f87171', fg = '#fff';
        if (alert.type === 'dry') { bg = '#f87171'; fg = '#fff'; }
        if (alert.type === 'over') { bg = '#38bdf8'; fg = '#fff'; }
        if (alert.type === 'sensor') { bg = '#fbbf24'; fg = '#222'; }
        if (alert.type === 'safe') { bg = '#bbf7d0'; fg = '#166534'; }
        toast({
          title: alert.type === 'safe' ? 'All Good!' : 'Plant Alert',
          description: alert.message,
          style: {
            backgroundColor: bg,
            color: fg,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          position: 'top-center',
        });
      }
    });

    // Show a green notification for Safe status
    if (plantData.thresholds && plantData.moisture >= plantData.thresholds.dry && plantData.moisture <= plantData.thresholds.overwet) {
      toast({
        title: 'All Good!',
        description: `Soil moisture is in the safe range (${plantData.moisture.toFixed(1)}%).`,
        style: {
          backgroundColor: '#bbf7d0',
          color: '#166534',
          fontWeight: 'bold',
          textAlign: 'center',
        },
        position: 'top-center',
      });
    }
  }, [plantData, toast]);

  return (
    <div className="min-h-screen bg-ui-bg-main">


      {/* ── Header row ── */}
      <DashboardHeader
        selectedPlant={selectedPlant}
        onPlantChange={setSelectedPlant}
        plants={{
          PLANT_01: { name: "Money Plant" },
          PLANT_02: { name: "Snake Plant" },
          PLANT_03: { name: "Cactus" },
        }}
        lastUpdate={plantData?.lastUpdate || "-"}
        thresholds={plantData?.thresholds}
        lastWatered={plantData?.lastWatered}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : plantData ? (
          <>
            <StatusCardsRow data={{
              ...plantData,
              lastWatered: plantData.lastWatered // Pass correct last watered time to Pump Status card
            }} thresholds={plantData.thresholds} />
            <MoistureChartRow data={plantData} />
            <AlertsAndInsights data={plantData} />
            <AdvancedAnalytics data={plantData} />
          </>
        ) : (
          <div>No data available.</div>
        )}
      </main>

      {/* Floating Plant Assistant Button */}
      <button
        onClick={() => setChatbotOpen((o) => !o)}
        aria-label="Toggle plant assistant"
        style={{
          position: "fixed",
          bottom: "32px",
          left: "24px",
          zIndex: 50,
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
        className="plant-assistant-cloud highlight-bounce"
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "58px",
            borderRadius: "32px 32px 32px 32px / 40px 40px 28px 40px",
            background: chatbotOpen
              ? "linear-gradient(135deg, #16a34a 60%, #15803d 100%)"
              : "linear-gradient(135deg, #e0f7ef 60%, #b9f5d8 100%)",
            boxShadow: chatbotOpen
              ? "0 0 24px 8px #4ade80, 0 6px 24px rgba(22,163,74,0.18)"
              : "0 0 18px 4px #a7f3d0, 0 6px 24px rgba(22,163,74,0.10)",
            border: chatbotOpen
              ? "2.5px solid #16a34a"
              : "2.5px solid #a7f3d0",
            transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "2.2rem", marginRight: "-2px", filter: chatbotOpen ? "drop-shadow(0 0 8px #4ade80)" : "drop-shadow(0 0 4px #a7f3d0)" }}>☁️</span>
          <span style={{
            position: "absolute",
            fontSize: "1.7rem",
            marginLeft: "-36px",
            marginTop: "12px",
            pointerEvents: "none",
            filter: chatbotOpen ? "drop-shadow(0 0 8px #4ade80)" : "drop-shadow(0 0 4px #a7f3d0)"
          }}>🌿</span>
        </span>
      </button>

      {/* Chatbot — controlled by floating button */}
      <Chatbot
        selectedPlant={plantIdMap[selectedPlant]}
        isOpen={chatbotOpen}
        onToggle={() => setChatbotOpen((o) => !o)}
      />

      {/* Responsive and highlight styles for the floating button */}
      <style>{`
        @media (max-width: 640px) {
          .plant-assistant-cloud {
            left: 12px !important;
            bottom: 16px !important;
          }
          .plant-assistant-cloud span {
            width: 54px !important;
            height: 44px !important;
            font-size: 1.5rem !important;
          }
        }
        .highlight-bounce {
          animation: bounce-highlight 1.6s infinite cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes bounce-highlight {
          0%, 100% { transform: translateY(0); }
          20% { transform: translateY(-8px); }
          40% { transform: translateY(0); }
          60% { transform: translateY(-4px); }
          80% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}