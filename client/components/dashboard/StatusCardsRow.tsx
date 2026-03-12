import StatusCard from "@/components/dashboard/StatusCard";
import MoistureCard from "@/components/dashboard/MoistureCard";
import { Cloud, Droplets, Thermometer, Wind } from "lucide-react";

interface StatusCardsRowProps {
  data: {
    moisture: number;
    light: number;
    temperature: number;
    humidity: number;
    pumpStatus: string;
    lastWatered: string;
    lastWaterAmount: number;
    todayWaterTotal: number;
  };
}

export default function StatusCardsRow({ data }: StatusCardsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MoistureCard moisture={data.moisture} />

      <StatusCard
        title="Light Intensity"
        value={`${data.light} lux`}
        icon={<Cloud className="w-8 h-8 text-blue-600" />}
        color="blue"
      />

      <StatusCard
        title="Temperature"
        value={`${data.temperature}°C`}
        icon={<Thermometer className="w-8 h-8 text-orange-600" />}
        color="orange"
      />

      <StatusCard
        title="Humidity"
        value={`${data.humidity}% RH`}
        icon={<Wind className="w-8 h-8 text-cyan-600" />}
        color="cyan"
      />

      <StatusCard
        title="Pump Status"
        value={data.pumpStatus}
        subtitle={`Last Watered: ${data.lastWatered}`}
        icon={<Droplets className="w-8 h-8 text-primary" />}
        color="green"
      />

      <StatusCard
        title="Water Delivered"
        value={`${data.lastWaterAmount} mL`}
        subtitle={`Today Total: ${data.todayWaterTotal} mL`}
        icon={<Droplets className="w-8 h-8 text-blue-600" />}
        color="blue"
      />
    </div>
  );
}
