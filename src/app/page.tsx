import { BookOpen, Droplets, Flame, LayoutDashboard, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricCard } from "@/components/shared/metric-card";
import { PillBadge } from "@/components/shared/pill-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PILLAR_LIST } from "@/lib/pillars";

const HABITS = [
  { label: "Sleep", value: 82, icon: Moon, color: "primary" as const },
  { label: "Exercise", value: 60, icon: Flame, color: "orange" as const },
  { label: "Water", value: 45, icon: Droplets, color: "blue" as const },
  { label: "Reading", value: 70, icon: BookOpen, color: "teal" as const },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        icon={LayoutDashboard}
        title="Foundation Preview"
        description="Phase 1 — design system & app shell. The real dashboard arrives in Phase 2."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Study hours this week"
          value="12.5"
          unit="hrs"
          icon={PILLAR_LIST[0].icon}
          color={PILLAR_LIST[0].color}
          trend={{ direction: "up", value: "18%", isPositive: true }}
        />
        <MetricCard
          label="Resting heart rate"
          value="62"
          unit="bpm"
          icon={PILLAR_LIST[1].icon}
          color={PILLAR_LIST[1].color}
          trend={{ direction: "down", value: "4%", isPositive: true }}
        />
        <MetricCard
          label="Mindful minutes"
          value="24"
          unit="min"
          icon={PILLAR_LIST[2].icon}
          color={PILLAR_LIST[2].color}
        />
        <MetricCard
          label="Habits completed"
          value="9/12"
          icon={PILLAR_LIST[3].icon}
          color={PILLAR_LIST[3].color}
          trend={{ direction: "up", value: "2", isPositive: true }}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <SectionHeader title="Life pillars" description="The six pillars behind every score." />
            <div className="flex flex-wrap gap-2">
              {PILLAR_LIST.map((pillar) => (
                <PillBadge key={pillar.id} color={pillar.color}>
                  <pillar.icon className="size-3" strokeWidth={2} />
                  {pillar.label}
                </PillBadge>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button>Primary action</Button>
              <Button variant="outline">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-5">
            <SectionHeader title="Habit tracker" description="Today's consistency across your routines." />
            {HABITS.map((habit) => {
              const Icon = habit.icon;
              return (
                <div key={habit.label} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-muted-foreground">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between text-body">
                      <span className="text-foreground">{habit.label}</span>
                      <span className="text-muted-foreground">{habit.value}%</span>
                    </div>
                    <Progress value={habit.value} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
