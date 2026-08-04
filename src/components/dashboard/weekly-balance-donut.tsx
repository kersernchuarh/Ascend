"use client";

import { useReducedMotion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { WEEKLY_BALANCE, OVERALL_BALANCE_SCORE } from "@/data/dashboard";
import { PILLARS } from "@/lib/pillars";

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
        <div className="relative mx-auto aspect-square w-full max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
          </ResponsiveContainer>
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
