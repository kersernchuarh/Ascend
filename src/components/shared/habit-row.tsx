import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES, ACCENT_SOLID_CLASSES } from "@/lib/colors";
import { Progress } from "@/components/ui/progress";
import type { Habit } from "@/domain/types";

function HabitRow({
  habit,
  value,
  className,
}: {
  habit: Habit;
  /** Today's logged value, 0-100. `undefined` means "not logged today" —
   *  shown honestly rather than defaulting to 0. */
  value: number | undefined;
  className?: string;
}) {
  const Icon = habit.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
          ACCENT_CHIP_CLASSES[habit.color]
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between text-body">
          <span className="text-foreground">{habit.label}</span>
          <span className="text-muted-foreground">
            {value != null ? `${value}%` : "Not logged today"}
          </span>
        </div>
        <Progress
          value={value ?? 0}
          className="h-1.5"
          indicatorClassName={ACCENT_SOLID_CLASSES[habit.color]}
        />
      </div>
    </div>
  );
}

export { HabitRow };
