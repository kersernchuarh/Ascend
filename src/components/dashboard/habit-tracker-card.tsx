"use client";

import { Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { HabitRow } from "@/components/shared/habit-row";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_HABITS } from "@/data/dashboard";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { habitStreak, weeklyCompletionGrid } from "@/domain/metrics";

function HabitTrackerCard() {
  const { logs, isCompletedToday, toggleHabitToday, status } = useHabits();
  const now = useNow();
  const loggedCount = SEED_HABITS.filter((habit) => isCompletedToday(habit.id)).length;

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Habit Tracker"
          description={status === "ready" ? `${loggedCount}/${SEED_HABITS.length} logged today` : undefined}
        />
        {status === "loading" || !now ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ) : SEED_HABITS.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Repeat className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">No habits tracked yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {SEED_HABITS.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                completed={isCompletedToday(habit.id)}
                streak={habitStreak(logs, habit.id, now)}
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
