import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCardsRow from "@/components/dashboard/StatusCardsRow";
import MoistureChartRow from "@/components/dashboard/MoistureChartRow";
import AlertsAndInsights from "@/components/dashboard/AlertsAndInsights";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";

export default function Index() {
  const [selectedPlant, setSelectedPlant] = useState<
    "PLANT_01" | "PLANT_02" | "PLANT_03"
  >("PLANT_01");

  const plants = {
    PLANT_01: { name: "Snake Plant", data: plantData.snake },
    PLANT_02: { name: "Money Plant", data: plantData.money },
    PLANT_03: { name: "Cactus", data: plantData.cactus },
  };

  const currentPlantData = plants[selectedPlant].data;

  return (
    <div className="min-h-screen bg-ui-bg-main">
      <DashboardHeader
        selectedPlant={selectedPlant}
        onPlantChange={setSelectedPlant}
        plants={plants}
        lastUpdate={currentPlantData.lastUpdate}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <StatusCardsRow data={currentPlantData} />
        <MoistureChartRow data={currentPlantData} />
        <AlertsAndInsights data={currentPlantData} />
        <AdvancedAnalytics data={currentPlantData} />
      </main>
    </div>
  );
}

// Mock data for each plant
const plantData = {
  snake: {
    moisture: 45,
    light: 320,
    temperature: 27,
    humidity: 62,
    pumpStatus: "OFF",
    lastWatered: "12:15 PM",
    lastWaterAmount: 45,
    todayWaterTotal: 120,
    lastUpdate: "12:21:30 PM",
    moistureHistory: [
      { time: "08:00", value: 65 },
      { time: "09:00", value: 63 },
      { time: "10:00", value: 61 },
      { time: "11:00", value: 58 },
      { time: "12:00", value: 52 },
      { time: "12:15", value: 77 },
      { time: "13:00", value: 72 },
      { time: "14:00", value: 68 },
      { time: "15:00", value: 64 },
      { time: "16:00", value: 58 },
      { time: "17:00", value: 54 },
      { time: "18:00", value: 48 },
    ],
    alerts: [
      { type: "dry", message: "Dry soil – watering required", active: true },
      { type: "over", message: "Over-watering risk", active: false },
      { type: "sensor", message: "Sensor offline", active: false },
    ],
    mlInsights: {
      wateringRequired: true,
      confidence: 87,
      nextWateringTime: "4 hours",
      insight:
        "High light intensity detected – faster moisture drop observed.",
    },
    irrigationImpact: {
      amount: 45,
      previousMoisture: 52,
      currentMoisture: 77,
      moistureIncrease: 25,
    },
    analytics: {
      dropRate: 4,
      avgWaterPerEvent: 40,
      weeklyUsage: 850,
    },
  },
  money: {
    moisture: 58,
    light: 280,
    temperature: 25,
    humidity: 68,
    pumpStatus: "OFF",
    lastWatered: "11:45 AM",
    lastWaterAmount: 50,
    todayWaterTotal: 100,
    lastUpdate: "12:21:30 PM",
    moistureHistory: [
      { time: "08:00", value: 72 },
      { time: "09:00", value: 70 },
      { time: "10:00", value: 67 },
      { time: "11:00", value: 64 },
      { time: "11:45", value: 80 },
      { time: "12:00", value: 78 },
      { time: "13:00", value: 75 },
      { time: "14:00", value: 71 },
      { time: "15:00", value: 68 },
      { time: "16:00", value: 64 },
      { time: "17:00", value: 61 },
      { time: "18:00", value: 58 },
    ],
    alerts: [
      { type: "dry", message: "Dry soil – watering required", active: false },
      { type: "over", message: "Over-watering risk", active: false },
      { type: "sensor", message: "Sensor offline", active: false },
    ],
    mlInsights: {
      wateringRequired: false,
      confidence: 92,
      nextWateringTime: "8 hours",
      insight: "Moderate soil moisture with stable light conditions.",
    },
    irrigationImpact: {
      amount: 50,
      previousMoisture: 64,
      currentMoisture: 80,
      moistureIncrease: 16,
    },
    analytics: {
      dropRate: 3.5,
      avgWaterPerEvent: 42,
      weeklyUsage: 820,
    },
  },
  cactus: {
    moisture: 32,
    light: 450,
    temperature: 29,
    humidity: 45,
    pumpStatus: "OFF",
    lastWatered: "2 days ago",
    lastWaterAmount: 35,
    todayWaterTotal: 0,
    lastUpdate: "12:21:30 PM",
    moistureHistory: [
      { time: "08:00", value: 48 },
      { time: "09:00", value: 46 },
      { time: "10:00", value: 44 },
      { time: "11:00", value: 41 },
      { time: "12:00", value: 38 },
      { time: "13:00", value: 35 },
      { time: "14:00", value: 33 },
      { time: "15:00", value: 32 },
      { time: "16:00", value: 32 },
      { time: "17:00", value: 32 },
      { time: "17:30", value: 32 },
      { time: "18:00", value: 32 },
    ],
    alerts: [
      { type: "dry", message: "Dry soil – watering required", active: false },
      { type: "over", message: "Over-watering risk", active: false },
      { type: "sensor", message: "Sensor offline", active: false },
    ],
    mlInsights: {
      wateringRequired: false,
      confidence: 95,
      nextWateringTime: "2 days",
      insight:
        "Cactus prefers dry conditions. Current moisture ideal for this plant type.",
    },
    irrigationImpact: {
      amount: 35,
      previousMoisture: 48,
      currentMoisture: 68,
      moistureIncrease: 20,
    },
    analytics: {
      dropRate: 0.8,
      avgWaterPerEvent: 35,
      weeklyUsage: 180,
    },
  },
};
