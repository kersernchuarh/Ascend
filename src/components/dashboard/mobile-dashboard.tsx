"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { MOCK_USER } from "@/data/mock";
import {
  TODAY_TASKS,
  HABITS,
  CALENDAR_PREVIEW,
  OVERALL_BALANCE_SCORE,
  AI_INSIGHT,
  type DashboardTask,
} from "@/data/dashboard";
import { PILLARS } from "@/lib/pillars";
import { ACCENT_SOLID_CLASSES, type AccentColor } from "@/lib/colors";
import { HabitRow } from "@/components/shared/habit-row";
import { PillBadge } from "@/components/shared/pill-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/shared/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getBalanceTakeaway(score: number): { label: string; color: AccentColor } {
  if (score >= 75) return { label: "Strong week", color: "green" };
  if (score >= 50) return { label: "Steady progress", color: "blue" };
  return { label: "Needs attention", color: "orange" };
}

function MobileDashboard() {
  const prefersReducedMotion = useReducedMotion();
  const [greeting, setGreeting] = React.useState("Good day");
  const [tasks, setTasks] = React.useState<DashboardTask[]>(() => TODAY_TASKS.slice(0, 4));

  React.useEffect(() => {
    // One-time sync with the visitor's local clock — unknowable during SSR,
    // an intentional exception to the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  };

  const takeaway = getBalanceTakeaway(OVERALL_BALANCE_SCORE);
  const previewHabits = HABITS.slice(0, 3);

  return (
    <motion.div
      className="flex w-full flex-col gap-6"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h2 className="text-h2 text-foreground">
        {greeting}, {MOCK_USER.name}
      </h2>

      <Card className="w-full">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-display text-foreground">{OVERALL_BALANCE_SCORE}</span>
            <span className="text-caption text-muted-foreground">Life balance</span>
          </div>
          <PillBadge color={takeaway.color}>{takeaway.label}</PillBadge>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Today" />
          <div className="flex flex-col">
            {tasks.map((task) => {
              const pillar = PILLARS[task.pillar];
              return (
                <label
                  key={task.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] px-1 transition-colors hover:bg-surface-2"
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="size-5"
                  />
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", ACCENT_SOLID_CLASSES[pillar.color])}
                  />
                  <span
                    className={cn(
                      "flex-1 text-body text-foreground",
                      task.done && "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="This week" />
          <div className="grid grid-cols-7 gap-1">
            {CALENDAR_PREVIEW.map((day) => (
              <div
                key={day.label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[10px] py-2",
                  day.isToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-foreground"
                )}
              >
                <span
                  className={cn(
                    "text-caption",
                    day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </span>
                <span className="text-body">{day.date}</span>
                <span
                  className={cn(
                    "size-1 rounded-full",
                    day.eventCount > 0
                      ? day.isToday
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : "bg-transparent"
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            title="Habits"
            action={
              HABITS.length > 3 ? (
                <span className="text-caption text-primary">View all</span>
              ) : undefined
            }
          />
          <div className="flex flex-col gap-4">
            {previewHabits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Link href="/ai" className="block">
        <Card className="w-full cursor-pointer">
          <CardContent className="flex min-h-12 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <Sparkles className="size-4" strokeWidth={2} />
            </span>
            <p className="flex-1 truncate text-body text-foreground">{AI_INSIGHT.message}</p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export { MobileDashboard };
