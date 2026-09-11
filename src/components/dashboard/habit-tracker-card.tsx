"use client";

import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { HabitRow } from "@/components/shared/habit-row";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { dueTodayHabits, habitStreak, weeklyCompletionGrid } from "@/domain/metrics";

/** Only habits actually due *today*, per their own cadence — not every
 *  habit with a percentage next to it (PRODUCT_BLUEPRINT.md §9.2's "Habits
 *  due today" intent, now buildable since cadence is real). A
 *  `times_per_week` habit has no single due day, so it's always shown —
 *  any day can still contribute toward its weekly target. */
function HabitTrackerCard() {
  const { habits, logs, isCompletedToday, toggleHabitToday, status } = useHabits();
  const now = useNow();

  const dueToday = useMemo(() => (now ? dueTodayHabits(habits, now) : []), [habits, now]);
  const loggedCount = dueToday.filter((habit) => isCompletedToday(habit.id)).length;

  return (
    <Card className="w-full" flat>
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Habit Tracker"
          description={status === "ready" ? `${loggedCount}/${dueToday.length} logged today` : undefined}
        />
        {status === "loading" || !now ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ) : dueToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Repeat className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">
              {habits.length === 0 ? "No habits tracked yet" : "Nothing due today"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {dueToday.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                completed={isCompletedToday(habit.id)}
                streak={habitStreak(habit, logs, now)}
                weekGrid={weeklyCompletionGrid(logs, habit.id, now)}
                onToggle={() => toggleHabitToday(habit.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { HabitTrackerCard };
