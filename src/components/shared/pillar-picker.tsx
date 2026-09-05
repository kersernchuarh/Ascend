"use client";

import { cn } from "@/lib/utils";
import { PILLARS, type PillarId } from "@/lib/pillars";

const PILLAR_ORDER: PillarId[] = ["academics", "health", "mind", "growth", "life", "productivity"];

type PillarPickerProps = {
  value: PillarId;
  onChange: (pillar: PillarId) => void;
  label?: string;
};

/**
 * A radiogroup of pillar icons — extracted once a third consumer needed the
 * same picker (`AddTaskRow`, and Work's deliverable/task create forms),
 * rather than duplicating this markup a third time.
 */
function PillarPicker({ value, onChange, label = "Pillar" }: PillarPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {PILLAR_ORDER.map((id) => {
        const pillar = PILLARS[id];
        const Icon = pillar.icon;
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={pillar.label}
            onClick={() => onChange(id)}
            className={cn(
              "flex size-7 items-center justify-center rounded-[8px] border transition-colors",
              selected
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-[#2a3441] hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}

export { PillarPicker };
