"use client";

import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { HABIT_ICON_OPTIONS } from "@/lib/habit-icons";

type HabitIconPickerProps = {
  value: number;
  onChange: (index: number) => void;
};

function HabitIconPicker({ value, onChange }: HabitIconPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Habit icon">
      {HABIT_ICON_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const selected = index === value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            onClick={() => onChange(index)}
            className={cn(
              "flex size-8 items-center justify-center rounded-[8px] border transition-colors",
              selected ? "border-primary" : "border-border hover:border-[#2a3441]",
              ACCENT_CHIP_CLASSES[option.color]
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}

export { HabitIconPicker };
