"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Repeat } from "lucide-react";
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
 *  any day can still contribute toward its weekly target. Deliberately a
 *  genuinely compact glance (§33): direct completion controls via
 *  `HabitRow`'s checkbox, plus a real link out to the full Habits page
 *  rather than reproducing its richer history/streak detail here. */
function HabitTrackerCard() {
  const { habits, logs, isCompletedToday, toggleHabitToday, status } = useHabits();
  const now = useNow();

  const dueToday = useMemo(() => (now ? dueTodayHabits(habits, now) : []), [habits, now]);
  const loggedCount = dueToday.filter((habit) => isCompletedToday(habit.id)).length;

  return (
    <Card className="w-full" flat>
      <CardContent className="flex flex-col gap-3">
        <SectionHeader
          title="Habits today"
          description={status === "ready" ? `${loggedCount}/${dueToday.length} logged today` : undefined}
          action={
            <Link
              href="/habits"
              className="flex shrink-0 items-center gap-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        {status === "loading" || !now ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ) : dueToday.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <Repeat className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-caption text-muted-foreground">
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
