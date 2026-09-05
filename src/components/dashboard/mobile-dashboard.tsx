"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Scale, Sparkles, ChevronRight } from "lucide-react";
import { MOCK_USER } from "@/data/mock";
import { SEED_HABITS, createSeedCalendarEvents } from "@/data/dashboard";
import { useTasks } from "@/state/task-context";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { addDays, isSameDay, startOfWeek } from "@/domain/time";
import { formatWeekdayShort } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import { ACCENT_SOLID_CLASSES } from "@/lib/colors";
import { HabitRow } from "@/components/shared/habit-row";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/shared/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function MobileDashboard() {
  const prefersReducedMotion = useReducedMotion();
  const [greeting, setGreeting] = React.useState("Good day");
  const { todayTasks, toggleTask, status: taskStatus } = useTasks();
  const { isCompletedToday, toggleHabitToday } = useHabits();
  const now = useNow();
  // Mobile shows a short preview of today rather than the full list; the tasks
  // themselves come from the shared store, so toggling here and on desktop
  // acts on the same state.
  const tasks = todayTasks.slice(0, 4);

  React.useEffect(() => {
    // One-time sync with the visitor's local clock — unknowable during SSR,
    // an intentional exception to the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  const previewHabits = SEED_HABITS.slice(0, 3);

  // Real days of the actual current week, with real per-day event counts —
  // replaces the old CALENDAR_PREVIEW, which hardcoded a specific week (Wed
  // the 5th as "today") that was already wrong the moment the date changed.
  const weekDays = React.useMemo(() => {
    if (!now) return [];
    const events = createSeedCalendarEvents(now);
    const monday = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return {
        date,
        isToday: isSameDay(date, now),
        eventCount: events.filter((event) => isSameDay(new Date(event.startAt), date))
          .length,
      };
    });
  }, [now]);

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

      {/* The old hero here showed a "66" life-balance score averaged from
          six hardcoded numbers — invented precision with nothing behind it
          (see weekly-balance-donut.tsx for the same fix on desktop). A real
          score needs logged session and habit history; until then, honest
          beats impressive. */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <Scale className="size-6 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-body text-foreground">Weekly balance</span>
          <p className="max-w-[240px] text-caption text-muted-foreground">
            Not enough data yet — appears once you start logging sessions and habits.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Today" />
          {taskStatus === "loading" ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              <Skeleton className="h-12 w-full rounded-[10px]" />
              <Skeleton className="h-12 w-full rounded-[10px]" />
            </div>
          ) : (
            <div className="flex flex-col">
              {tasks.map((task) => {
                const pillar = PILLARS[task.pillar];
                return (
                  <label
                    key={task.id}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] px-1 transition-colors hover:bg-surface-2"
                  >
                    <Checkbox
                      checked={!!task.completedAt}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="size-5"
                    />
                    <span
                      className={cn("size-1.5 shrink-0 rounded-full", ACCENT_SOLID_CLASSES[pillar.color])}
                    />
                    <span
                      className={cn(
                        "flex-1 text-body text-foreground",
                        task.completedAt && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="This week" />
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
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
                  {formatWeekdayShort(day.date)}
                </span>
                <span className="text-body">{day.date.getDate()}</span>
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
              SEED_HABITS.length > 3 ? (
                <span className="text-caption text-primary">View all</span>
              ) : undefined
            }
          />
          <div className="flex flex-col gap-4">
            {previewHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                completed={isCompletedToday(habit.id)}
                onToggle={() => toggleHabitToday(habit.id)}
              />
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
            <p className="flex-1 truncate text-body text-foreground">Ask Ascend for a plan</p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export { MobileDashboard };
