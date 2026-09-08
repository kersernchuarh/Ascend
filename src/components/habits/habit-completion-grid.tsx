"use client";

import { cn } from "@/lib/utils";
import { ACCENT_SOLID_CLASSES, type AccentColor } from "@/lib/colors";
import { isSameDay, toIsoDateLocal } from "@/domain/time";
import type { DayCompletion } from "@/domain/metrics";

type HabitCompletionGridProps = {
  /** Monday-first, N weeks — see `domain/metrics.completionHistory`. */
  grid: DayCompletion[];
  color: AccentColor;
  now: Date;
  onToggleDate: (date: string) => void;
};

/**
 * A real calendar-style completion grid — every cell is a real logged (or
 * not-logged) day, never extrapolated. Answers "which days did I actually
 * do this, and which did I miss" over several weeks at a glance. Future
 * days (the current week hasn't finished yet) are rendered inert: you can't
 * complete a habit for a day that hasn't happened.
 */
function HabitCompletionGrid({ grid, color, now, onToggleDate }: HabitCompletionGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Completion history">
      {grid.map((day) => {
        const dateStr = toIsoDateLocal(day.date);
        const isToday = isSameDay(day.date, now);
        const isFuture = day.date.getTime() > now.getTime() && !isToday;
        return (
          <button
            key={dateStr}
            type="button"
            disabled={isFuture}
            onClick={() => onToggleDate(dateStr)}
            aria-label={`${dateStr}${isFuture ? " — upcoming" : day.completed ? " — completed" : " — not completed"}`}
            aria-pressed={!isFuture ? day.completed : undefined}
            className={cn(
              "aspect-square rounded-[4px] border border-border transition-colors",
              isFuture
                ? "cursor-not-allowed border-dashed bg-transparent opacity-50"
                : day.completed
                  ? cn("border-transparent", ACCENT_SOLID_CLASSES[color])
                  : "bg-border hover:bg-[#2a3441]",
              isToday && "ring-1 ring-primary ring-offset-1 ring-offset-card"
            )}
          />
        );
      })}
    </div>
  );
}

export { HabitCompletionGrid };
