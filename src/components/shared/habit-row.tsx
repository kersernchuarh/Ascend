import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES, ACCENT_SOLID_CLASSES } from "@/lib/colors";
import { Checkbox } from "@/components/ui/checkbox";
import type { DayCompletion } from "@/domain/metrics";
import type { Habit } from "@/domain/types";

/**
 * "Did I do this today?" is the checkbox. "How consistently have I been
 * doing it?" is the 7-day grid — real logged days, Monday first, nothing
 * extrapolated for days with no entry. No percentage, no cadence/adherence:
 * neither is derivable without a target the product doesn't let a user set
 * yet (see PRODUCT_BLUEPRINT.md's Phase 2 record) — the grid answers "what
 * days did I miss" without needing one. The streak (from
 * `domain/metrics.habitStreak`) only renders once it's actually > 0.
 */
function HabitRow({
  habit,
  completed,
  streak,
  weekGrid,
  onToggle,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  weekGrid: DayCompletion[];
  onToggle: () => void;
}) {
  const Icon = habit.icon;
  const daysLogged = weekGrid.filter((d) => d.completed).length;

  return (
    <div className="flex items-center gap-3 py-2">
      <Checkbox
        checked={completed}
        onCheckedChange={onToggle}
        aria-label={completed ? `Mark ${habit.label} not done today` : `Mark ${habit.label} done today`}
      />
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
          ACCENT_CHIP_CLASSES[habit.color]
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-body">
          <span
            className={cn(
              "text-foreground",
              completed && "text-muted-foreground"
            )}
          >
            {habit.label}
          </span>
          {streak > 0 ? (
            <span className="shrink-0 text-caption font-medium text-primary">
              {streak} day{streak === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1" aria-hidden="true">
          {weekGrid.map((day, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                day.completed ? ACCENT_SOLID_CLASSES[habit.color] : "bg-surface-2"
              )}
            />
          ))}
        </div>
        <span className="sr-only">{daysLogged} of 7 days logged this week</span>
      </div>
    </div>
  );
}

export { HabitRow };
