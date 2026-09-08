"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HabitForm, type HabitFormInput } from "@/components/habits/habit-form";
import { HabitCompletionGrid } from "@/components/habits/habit-completion-grid";
import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { formatCadence } from "@/lib/format-habit";
import { HABIT_ICON_MAP } from "@/lib/habit-icons";
import { completionHistory, habitAdherence, habitStreak } from "@/domain/metrics";
import type { Habit, HabitLog } from "@/domain/types";

type HabitCardProps = {
  habit: Habit;
  logs: HabitLog[];
  now: Date;
  completedToday: boolean;
  onToggleToday: () => void;
  onToggleDate: (date: string) => void;
  onUpdate: (input: HabitFormInput) => void;
  onSetArchived: (archived: boolean) => void;
};

const HISTORY_WEEKS = 4;

/** One habit's full card: today's checkbox, cadence, streak, this-week
 *  adherence, and a real completion-history grid — the dedicated Habits
 *  page's unit, richer than Home's compact summary row deliberately. */
function HabitCard({
  habit,
  logs,
  now,
  completedToday,
  onToggleToday,
  onToggleDate,
  onUpdate,
  onSetArchived,
}: HabitCardProps) {
  const [editing, setEditing] = useState(false);
  const Icon = HABIT_ICON_MAP[habit.iconKey];
  const streak = habitStreak(habit, logs, now);
  const adherence = habitAdherence(habit, logs, now);
  const grid = completionHistory(logs, habit.id, now, HISTORY_WEEKS);
  const streakUnit = habit.cadence.type === "times_per_week" ? "week" : "day";

  if (editing) {
    return (
      <div className="rounded-[10px] border border-border p-3">
        <HabitForm
          initialHabit={habit}
          onSubmit={(input) => {
            onUpdate(input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[10px] border border-border p-3",
        habit.archivedAt && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completedToday}
          onCheckedChange={onToggleToday}
          disabled={!!habit.archivedAt}
          aria-label={completedToday ? `Mark ${habit.label} not done today` : `Mark ${habit.label} done today`}
          className="mt-[3px] shrink-0"
        />
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
            ACCENT_CHIP_CLASSES[habit.color]
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-body text-foreground">{habit.label}</span>
            {streak > 0 ? (
              <span className="shrink-0 text-caption font-medium text-primary">
                {streak} {streakUnit}
                {streak === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span>{formatCadence(habit.cadence)}</span>
            {adherence.target > 0 ? (
              <span>
                {adherence.completed}/{adherence.target} this week
              </span>
            ) : null}
          </div>
          {habit.description ? <p className="text-caption text-muted-foreground">{habit.description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${habit.label}`} onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={habit.archivedAt ? `Unarchive ${habit.label}` : `Archive ${habit.label}`}
            onClick={() => onSetArchived(!habit.archivedAt)}
          >
            {habit.archivedAt ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
          </Button>
        </div>
      </div>
      <HabitCompletionGrid grid={grid} color={habit.color} now={now} onToggleDate={onToggleDate} />
    </div>
  );
}

export { HabitCard };
