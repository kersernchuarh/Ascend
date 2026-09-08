"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Repeat } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { dueTodayHabits, totalFocusedMinutes } from "@/domain/metrics";
import { weekInReview } from "@/domain/progress";
import { formatDuration } from "@/lib/format-date";

/**
 * A very small amount of recent progress — never the full Progress page.
 * "Free today" (a raw capacity number) is deliberately gone from here: the
 * same `freeMinutesForDay` calculation it used still runs, just as guidance
 * inside Today's Plan and Schedule instead of a standalone metric with no
 * decision attached to it (this phase's explicit product direction).
 */
function TodayProgressStrip() {
  const { tasks: allTasks, todayTasks, completedCount, status: taskStatus } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { habits, isCompletedToday, status: habitStatus } = useHabits();
  const now = useNow();

  const focusedMinutes = now ? totalFocusedMinutes(sessions, now) : 0;
  const dueToday = useMemo(() => (now ? dueTodayHabits(habits, now) : []), [habits, now]);
  const habitsLogged = dueToday.filter((habit) => isCompletedToday(habit.id)).length;
  const ready = taskStatus === "ready" && sessionStatus === "ready" && habitStatus === "ready" && now != null;

  const week = useMemo(() => (now ? weekInReview(sessions, allTasks, now) : null), [sessions, allTasks, now]);
  const trend = useMemo(() => {
    if (!week || !week.previous) return null;
    const delta = week.focusedMinutes - week.previous.focusedMinutes;
    if (delta === 0) return "same focused time as last week";
    return delta > 0
      ? `up ${formatDuration(delta)} from last week`
      : `down ${formatDuration(-delta)} from last week`;
  }, [week]);

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Today's progress" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          label="Habits logged"
          value={ready ? `${habitsLogged}` : "–"}
          unit={ready ? `/${dueToday.length}` : undefined}
          icon={Repeat}
          color="primary"
        />
      </section>
      {ready && week ? (
        <Link
          href="/progress"
          className="flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          This week: {week.sessionCount} session{week.sessionCount === 1 ? "" : "s"} ·{" "}
          {formatDuration(week.focusedMinutes)} focused{trend ? ` · ${trend}` : ""}
          <ArrowRight className="size-3.5 shrink-0" />
        </Link>
      ) : null}
    </div>
  );
}

export { TodayProgressStrip };
