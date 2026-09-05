import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { Checkbox } from "@/components/ui/checkbox";
import type { Habit } from "@/domain/types";

/**
 * A habit is now logged, not measured — see `domain/types.HabitLog`. There
 * is no meaningful progress bar for a plain done/not-done fact (a bar that
 * only ever shows 0% or 100% is stranger than a checkbox, and anything
 * between would be invented), so this mirrors the same checkbox pattern
 * already used for tasks rather than inventing a new interaction.
 */
function HabitRow({
  habit,
  completed,
  onToggle,
  className,
}: {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const Icon = habit.icon;

  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      <Checkbox checked={completed} onCheckedChange={onToggle} />
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
          ACCENT_CHIP_CLASSES[habit.color]
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="flex flex-1 items-center justify-between text-body">
        <span
          className={cn(
            "text-foreground",
            completed && "text-muted-foreground line-through"
          )}
        >
          {habit.label}
        </span>
        <span className="text-caption text-muted-foreground">
          {completed ? "Logged today" : "Not logged"}
        </span>
      </div>
    </label>
  );
}

export { HabitRow };
