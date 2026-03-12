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
    <div className="rounded-lg border border-ui-border bg-ui-bg-card p-6">
      <h2 className="text-lg font-bold text-ui-text-primary mb-4">
        Soil Moisture vs Time
      </h2>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.moistureHistory}>
            {/* Background zones */}
            <defs>
              <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(118 47% 39%)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(118 47% 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ui-border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--ui-text-muted))"
              label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              label={{ value: "Soil Moisture (%)", angle: -90, position: "insideLeft" }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--ui-text-muted))"
            />

            {/* Reference lines for zones */}
            <ReferenceLine
              y={45}
              stroke="hsl(var(--zone-dry))"
              strokeDasharray="3 3"
              label={{ value: "Dry Zone", position: "right", fill: "hsl(var(--zone-dry))", fontSize: 11 }}
            />
            <ReferenceLine
              y={50}
              stroke="hsl(var(--zone-safe))"
              strokeDasharray="3 3"
              label={{ value: "Safe Zone", position: "right", fill: "hsl(var(--zone-safe))", fontSize: 11 }}
            />
            <ReferenceLine
              y={80}
              stroke="hsl(var(--zone-safe))"
              strokeDasharray="3 3"
              label={{ value: "", position: "right", fontSize: 11 }}
            />
            <ReferenceLine
              y={85}
              stroke="hsl(var(--zone-over-wet))"
              strokeDasharray="3 3"
              label={{ value: "Over-wet Zone", position: "right", fill: "hsl(var(--zone-over-wet))", fontSize: 11 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--ui-bg-card))",
                border: "1px solid hsl(var(--ui-border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--ui-text-primary))" }}
            />

            {/* Main line for moisture */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--zone-safe))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--zone-safe))", r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-zone-dry rounded-full"></div>
          <span className="text-ui-text-muted">Dry Zone (&lt;45%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-zone-safe rounded-full"></div>
          <span className="text-ui-text-muted">Safe Zone (50–80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-zone-over-wet rounded-full"></div>
          <span className="text-ui-text-muted">Over-wet Zone (&gt;85%)</span>
        </div>
      </div>
    </div>
  );
}
