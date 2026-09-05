"use client";

import { CheckCircle2, Clock, Repeat } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { SEED_HABITS } from "@/data/dashboard";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { totalFocusedMinutes } from "@/domain/metrics";

/**
 * Replaces the Weekly Balance donut, which could never honestly show
 * anything: a pillar-weighted balance score needs user-set targets that
 * don't exist yet (PRODUCT_BLUEPRINT.md §13). These three numbers are real
 * every single day — no trend, no percentage, no invented comparison to
 * "last week", just what actually happened today.
 */
function TodayProgressStrip() {
  const { todayTasks, completedCount, status: taskStatus } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { isCompletedToday, status: habitStatus } = useHabits();
  const now = useNow();

  const focusedMinutes = now ? totalFocusedMinutes(sessions, now) : 0;
  const habitsLogged = SEED_HABITS.filter((habit) => isCompletedToday(habit.id)).length;
  const ready = taskStatus === "ready" && sessionStatus === "ready" && habitStatus === "ready";

  return (
    <section
      aria-label="Today's progress"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
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
        label="Habits logged"
        value={ready ? `${habitsLogged}` : "–"}
        unit={ready ? `/${SEED_HABITS.length}` : undefined}
        icon={Repeat}
        color="primary"
      />
    </section>
  );
}

export { TodayProgressStrip };
