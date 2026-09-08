"use client";

import { useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitCard } from "@/components/habits/habit-card";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";

/**
 * Habits: what you're keeping up with, and how consistently — not a
 * percentage widget. Reads and writes the same `HabitProvider` state Home's
 * habit summary uses; there is no second representation to fall out of
 * sync (PRODUCT_BLUEPRINT.md's Habits + Progress phase).
 */
export default function HabitsPage() {
  const {
    habits,
    logs,
    status,
    addHabit,
    updateHabit,
    setHabitArchived,
    isCompletedToday,
    toggleHabitToday,
    toggleHabitOnDate,
  } = useHabits();
  const now = useNow();
  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(() => habits.filter((habit) => !habit.archivedAt), [habits]);
  const archived = useMemo(() => habits.filter((habit) => !!habit.archivedAt), [habits]);
  const ready = status === "ready" && now != null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader level={2} title="Habits" description="What you're keeping up with, and how consistently" />
          <HabitForm onSubmit={(input) => addHabit(input)} />

          {!ready ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-24 w-full rounded-[10px]" />
              <Skeleton className="h-24 w-full rounded-[10px]" />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Repeat className="size-6 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-body text-muted-foreground">No habits yet — add one above to start tracking it</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  logs={logs}
                  now={now ?? new Date()}
                  completedToday={isCompletedToday(habit.id)}
                  onToggleToday={() => toggleHabitToday(habit.id)}
                  onToggleDate={(date) => toggleHabitOnDate(habit.id, date)}
                  onUpdate={(input) => updateHabit(habit.id, input)}
                  onSetArchived={(archived) => setHabitArchived(habit.id, archived)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {ready && archived.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              aria-expanded={showArchived}
              onClick={() => setShowArchived((prev) => !prev)}
            >
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </Button>
            {showArchived ? (
              <div className="flex flex-col gap-3">
                {archived.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    logs={logs}
                    now={now ?? new Date()}
                    completedToday={isCompletedToday(habit.id)}
                    onToggleToday={() => toggleHabitToday(habit.id)}
                    onToggleDate={(date) => toggleHabitOnDate(habit.id, date)}
                    onUpdate={(input) => updateHabit(habit.id, input)}
                    onSetArchived={(archived) => setHabitArchived(habit.id, archived)}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
