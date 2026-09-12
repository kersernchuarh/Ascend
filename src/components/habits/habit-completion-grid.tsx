"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_SOLID_CLASSES, type AccentColor } from "@/lib/colors";
import { isSameDay, toIsoDateLocal } from "@/domain/time";
import type { DayCompletion } from "@/domain/metrics";

type HabitCompletionGridProps = {
  /** Monday-first, N weeks, oldest week first — see `domain/metrics.completionHistory`. */
  grid: DayCompletion[];
  color: AccentColor;
  now: Date;
  onToggleDate: (date: string) => void;
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
/** Fixed, small, and never wider than the viewport regardless of habit name
 *  length or how many weeks of history exist — the previous grid used
 *  `aspect-square` cells that grew with the card's own width, which is
 *  exactly what read as oversized (PRODUCT_BLUEPRINT.md §33). A 26px cell is
 *  compact but the *button* is 28px (see below) so the tappable area stays
 *  comfortable even though the visible square is small. */
const CELL_SIZE = "size-[26px]";

/**
 * A real calendar-style completion grid — every cell is a real logged (or
 * not-logged) day, never extrapolated. Answers "which days did I actually
 * do this, and which did I miss" over several weeks at a glance. Future
 * days (the current week hasn't finished yet) are rendered inert: you can't
 * complete a habit for a day that hasn't happened.
 *
 * Completion is never colour-only: a completed cell also shows a check
 * mark, so the grid reads correctly under colour-blindness or a monochrome
 * display. Today gets its own ring, independent of completion.
 */
function HabitCompletionGrid({ grid, color, now, onToggleDate }: HabitCompletionGridProps) {
  const weeks: DayCompletion[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Completion history">
      <div className="flex gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={index}
            className={cn("flex items-center justify-center text-[10px] text-muted-foreground", CELL_SIZE)}
            aria-hidden="true"
          >
            {label}
          </span>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex gap-1">
          {week.map((day) => {
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
                  "relative flex shrink-0 items-center justify-center rounded-[6px] border border-border transition-colors",
                  "size-7", // the tappable button — comfortably bigger than the visible cell inside it
                  isFuture && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-[4px]",
                    CELL_SIZE,
                    isFuture
                      ? "border border-dashed border-border bg-transparent opacity-50"
                      : day.completed
                        ? ACCENT_SOLID_CLASSES[color]
                        : "bg-surface-2 hover:bg-[#2a3441]"
                  )}
                >
                  {day.completed && !isFuture ? (
                    <Check className="size-3.5 text-background" strokeWidth={3} />
                  ) : null}
                </span>
                {isToday ? (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-[6px] ring-1 ring-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export { HabitCompletionGrid };
