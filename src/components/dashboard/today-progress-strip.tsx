"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, Hourglass, Repeat } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useHabits } from "@/state/habit-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useNow } from "@/domain/use-now";
import { dueTodayHabits, totalFocusedMinutes } from "@/domain/metrics";
import { freeMinutesForDay } from "@/domain/plan";

/**
 * Replaces the Weekly Balance donut, which could never honestly show
 * anything: a pillar-weighted balance score needs user-set targets that
 * don't exist yet (PRODUCT_BLUEPRINT.md §13). These four numbers are real
 * every single day — no trend, no percentage, no invented comparison to
 * "last week", just what actually happened (or is actually left) today.
 */
function TodayProgressStrip() {
  const { tasks, todayTasks, completedCount, status: taskStatus } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { habits, isCompletedToday, status: habitStatus } = useHabits();
  const { events, status: eventStatus } = useCalendarEvents();
  const { preferences, status: prefsStatus } = usePreferences();
  const now = useNow();

  const focusedMinutes = now ? totalFocusedMinutes(sessions, now) : 0;
  const dueToday = useMemo(() => (now ? dueTodayHabits(habits, now) : []), [habits, now]);
  const habitsLogged = dueToday.filter((habit) => isCompletedToday(habit.id)).length;
  const ready =
    taskStatus === "ready" &&
    sessionStatus === "ready" &&
    habitStatus === "ready" &&
    eventStatus === "ready" &&
    prefsStatus === "ready";

  const freeMinutes = now ? freeMinutesForDay(now, events, tasks, sessions, now, preferences) : 0;

  return (
    <section
      aria-label="Today's progress"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <MetricCard
        label="Tasks done"
        value={ready ? `${completedCount}` : "–"}
        unit={ready ? `/${todayTasks.length}` : undefined}
        icon={CheckCircle2}
        color="green"
      />
      <MetricCard
        label="Focused today"
        value={ready ? `${focusedMinutes}` : "–"}
        unit={ready ? "min" : undefined}
        icon={Clock}
        color="blue"
      />
      <MetricCard
        label="Free today"
        value={ready ? `${freeMinutes}` : "–"}
        unit={ready ? "min" : undefined}
        icon={Hourglass}
        color="orange"
      />
      <MetricCard
        label="Habits logged"
        value={ready ? `${habitsLogged}` : "–"}
        unit={ready ? `/${dueToday.length}` : undefined}
        icon={Repeat}
        color="primary"
      />
    </section>
  );
}

export { TodayProgressStrip };
