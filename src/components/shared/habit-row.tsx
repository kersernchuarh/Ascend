import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES, ACCENT_SOLID_CLASSES } from "@/lib/colors";
import { Progress } from "@/components/ui/progress";
import type { HabitEntry } from "@/data/dashboard";

function HabitRow({ habit, className }: { habit: HabitEntry; className?: string }) {
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
          <span className="text-muted-foreground">{habit.value}%</span>
        </div>
        <Progress
          value={habit.value}
          className="h-1.5"
          indicatorClassName={ACCENT_SOLID_CLASSES[habit.color]}
        />
      </div>
    </div>
  );
}

export { HabitRow };
