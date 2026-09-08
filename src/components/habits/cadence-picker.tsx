"use client";

import { cn } from "@/lib/utils";
import type { HabitCadence } from "@/domain/types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CADENCE_TYPES = ["daily", "days_of_week", "times_per_week"] as const;
const CADENCE_LABELS: Record<(typeof CADENCE_TYPES)[number], string> = {
  daily: "Daily",
  days_of_week: "Specific days",
  times_per_week: "X per week",
};

type CadencePickerProps = {
  value: HabitCadence;
  onChange: (cadence: HabitCadence) => void;
};

/** The cadence model itself (PRODUCT_BLUEPRINT.md's Habits + Progress
 *  phase): daily, specific days of the week, or a target count of days per
 *  week — the smallest set covering "every day", "these days", and "some
 *  number of times, any days" without inventing a fourth case. */
function CadencePicker({ value, onChange }: CadencePickerProps) {
  function setType(type: (typeof CADENCE_TYPES)[number]) {
    if (type === "daily") onChange({ type: "daily" });
    else if (type === "days_of_week") {
      onChange({ type: "days_of_week", days: value.type === "days_of_week" ? value.days : [1, 3, 5] });
    } else {
      onChange({ type: "times_per_week", target: value.type === "times_per_week" ? value.target : 3 });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cadence">
        {CADENCE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={value.type === type}
            onClick={() => setType(type)}
            className={cn(
              "h-7 rounded-[8px] border px-2.5 text-caption font-medium transition-colors",
              value.type === type
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-[#2a3441] hover:text-foreground"
            )}
          >
            {CADENCE_LABELS[type]}
          </button>
        ))}
      </div>

      {value.type === "days_of_week" ? (
        <div className="flex gap-1" role="group" aria-label="Days of week">
          {DAY_LABELS.map((label, day) => {
            const selected = value.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={DAY_NAMES[day]}
                onClick={() => {
                  const cadence = value as { type: "days_of_week"; days: number[] };
                  const days = selected ? cadence.days.filter((d) => d !== day) : [...cadence.days, day].sort();
                  onChange({ type: "days_of_week", days });
                }}
                className={cn(
                  "flex size-7 items-center justify-center rounded-[8px] border text-caption transition-colors",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-[#2a3441]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {value.type === "times_per_week" ? (
        <div className="flex items-center gap-2">
          <label className="text-caption text-muted-foreground" htmlFor="cadence-target">
            Times per week
          </label>
          <input
            id="cadence-target"
            type="number"
            min={1}
            max={7}
            value={value.target}
            onChange={(event) =>
              onChange({ type: "times_per_week", target: Math.min(7, Math.max(1, Number(event.target.value) || 1)) })
            }
            className="h-8 w-16 rounded-input border border-input bg-transparent px-2 text-sm text-foreground"
          />
        </div>
      ) : null}
    </div>
  );
}

export { CadencePicker };
