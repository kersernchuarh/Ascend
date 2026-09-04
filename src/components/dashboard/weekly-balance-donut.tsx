"use client";

import { useReducedMotion } from "framer-motion";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { WEEKLY_BALANCE, OVERALL_BALANCE_SCORE } from "@/data/dashboard";
import { PILLARS } from "@/lib/pillars";

const CHART_SIZE = 240;

const chartData = WEEKLY_BALANCE.map((entry) => ({
  name: PILLARS[entry.pillar].label,
  value: entry.score,
  color: PILLARS[entry.pillar].hex,
}));

function WeeklyBalanceDonut() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Weekly Balance"
          description="How your week adds up"
        />
        {/* Fixed size rather than ResponsiveContainer: the box is capped at 240px
            anyway, and ResponsiveContainer's first measurement lands at 0x0, which
            logged a Recharts size warning and made the donut pop in a frame late. */}
        <div className="relative mx-auto size-[240px] max-w-full">
          <PieChart width={CHART_SIZE} height={CHART_SIZE}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={3}
              startAngle={90}
              endAngle={450}
              strokeWidth={0}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={200}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-h2 text-foreground">
              {OVERALL_BALANCE_SCORE}
            </span>
            <span className="text-caption text-muted-foreground">
              Balance score
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {chartData.map((d) => (
            <span
              key={d.name}
              className="flex items-center gap-1.5 text-caption text-muted-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ background: d.color }}
              />
              {d.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { WeeklyBalanceDonut };
