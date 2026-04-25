import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  selectedPlant: "PLANT_01" | "PLANT_02" | "PLANT_03";
  onPlantChange: (plant: "PLANT_01" | "PLANT_02" | "PLANT_03") => void;
  plants: {
    PLANT_01: { name: string };
    PLANT_02: { name: string };
    PLANT_03: { name: string };
  };
  lastUpdate: string;
  thresholds?: { dry: number; safe: number; overwet: number };
  lastWatered?: string;
}
export default function DashboardHeader({
  selectedPlant,
  onPlantChange,
  plants,
  lastUpdate,
  thresholds,
  lastWatered
}: DashboardHeaderProps) {
  return (
    <header className="bg-ui-bg-card border-b border-ui-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-ui-text-primary mb-2">
              IoT Indoor Plant Health Monitoring System
            </h1>
            <div className="text-sm text-ui-text-secondary">
              <p className="mb-2">
                Plant Moisture Profile:
                {thresholds
                  ? ` Dry < ${thresholds.dry}% | Safe ${thresholds.dry}–${thresholds.overwet}% | Over-wet > ${thresholds.overwet}%`
                  : " Dry < 45% | Safe 50–80% | Over-wet > 85%"}
              </p>
              <p>
                Last Watered: {lastWatered || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-ui-text-primary">
              Select Plant
            </label>
            <Select
              value={selectedPlant}
              onValueChange={(value) =>
                onPlantChange(value as "PLANT_01" | "PLANT_02" | "PLANT_03")
              }
            >
              <SelectTrigger className="w-full md:w-64 bg-ui-bg-main border-ui-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANT_01">
                  PLANT_01 (Money Plant)
                </SelectItem>
                <SelectItem value="PLANT_02">
                  PLANT_02 (Snake Plant)
                </SelectItem>
                <SelectItem value="PLANT_03">PLANT_03 (Cactus)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
}
