import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

interface MoistureChartRowProps {
  data: {
    moistureHistory: Array<{ time: string; value: number }>;
  };
}

export default function MoistureChartRow({ data }: MoistureChartRowProps) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">
        Soil Moisture vs Time
      </h2>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.moistureHistory}>
            {/* Background zones */}
            <defs>
              <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71.8% 29.2%)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(142 71.8% 29.2%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              label={{ value: "Soil Moisture (%)", angle: -90, position: "insideLeft" }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />

            {/* Reference lines for zones */}
            <ReferenceLine
              y={45}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "Dry Zone", position: "right", fill: "#ef4444", fontSize: 11 }}
            />
            <ReferenceLine
              y={50}
              stroke="hsl(142 71.8% 29.2%)"
              strokeDasharray="3 3"
              label={{ value: "Safe Zone", position: "right", fill: "hsl(142 71.8% 29.2%)", fontSize: 11 }}
            />
            <ReferenceLine
              y={80}
              stroke="hsl(142 71.8% 29.2%)"
              strokeDasharray="3 3"
              label={{ value: "", position: "right", fontSize: 11 }}
            />
            <ReferenceLine
              y={85}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              label={{ value: "Over-wet Zone", position: "right", fill: "#3b82f6", fontSize: 11 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#000" }}
            />

            {/* Main line for moisture */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(142 71.8% 29.2%)"
              strokeWidth={3}
              dot={{ fill: "hsl(142 71.8% 29.2%)", r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500"></div>
          <span className="text-muted-foreground">Dry Zone (&lt;45%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary"></div>
          <span className="text-muted-foreground">Safe Zone (50–80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500"></div>
          <span className="text-muted-foreground">Over-wet Zone (&gt;85%)</span>
        </div>
      </div>
    </div>
  );
}
