"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CadencePicker } from "@/components/habits/cadence-picker";
import { HabitIconPicker } from "@/components/habits/habit-icon-picker";
import { HABIT_ICON_OPTIONS } from "@/lib/habit-icons";
import type { Habit, HabitCadence } from "@/domain/types";

export type HabitFormInput = {
  label: string;
  cadence: HabitCadence;
  description?: string;
  iconKey: Habit["iconKey"];
  color: Habit["color"];
};

type HabitFormProps = {
  /** Pass an existing habit to edit it in place — pre-fills every field and
   *  opens with the detail section already visible, since editing implies
   *  the user already wants to see (and likely change) more than the name. */
  initialHabit?: Habit;
  onSubmit: (input: HabitFormInput) => void;
  onCancel?: () => void;
};

function iconIndexFor(habit?: Habit): number {
  if (!habit) return 0;
  const index = HABIT_ICON_OPTIONS.findIndex((option) => option.key === habit.iconKey);
  return index === -1 ? 0 : index;
}

/**
 * The fast path is one field — a name, defaulting to a daily cadence
 * (visible immediately as "Every day", trivially changed, never hidden —
 * unlike the old implicit-default concern this product's history already
 * flagged). Cadence, icon, description sit behind "More", per this phase's
 * progressive-disclosure direction.
 */
function HabitForm({ initialHabit, onSubmit, onCancel }: HabitFormProps) {
  const [expanded, setExpanded] = useState(!!initialHabit);
  const [label, setLabel] = useState(initialHabit?.label ?? "");
  const [cadence, setCadence] = useState<HabitCadence>(initialHabit?.cadence ?? { type: "daily" });
  const [description, setDescription] = useState(initialHabit?.description ?? "");
  const [iconIndex, setIconIndex] = useState(iconIndexFor(initialHabit));

  const canSubmit = label.trim().length > 0 && !(cadence.type === "days_of_week" && cadence.days.length === 0);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const option = HABIT_ICON_OPTIONS[iconIndex];
    onSubmit({
      label: label.trim(),
      cadence,
      description: description.trim() || undefined,
      iconKey: option.key,
      color: option.color,
    });
    if (!initialHabit) {
      setLabel("");
      setCadence({ type: "daily" });
      setDescription("");
      setIconIndex(0);
      setExpanded(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="New habit — e.g. Sleep 8 hours"
          aria-label="Habit name"
          className="min-w-[200px] flex-1"
        />
        <Button
          type="submit"
          size={initialHabit ? "sm" : "icon"}
          aria-label={initialHabit ? "Save changes" : "Add habit"}
          disabled={!canSubmit}
        >
          {initialHabit ? "Save" : <Plus className="size-4" />}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            More
          </Button>
        )}
      </div>
      {expanded ? (
        <div className="flex flex-col gap-3 rounded-[10px] border border-border p-3">
          <CadencePicker value={cadence} onChange={setCadence} />
          <HabitIconPicker value={iconIndex} onChange={setIconIndex} />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Notes (optional)"
            aria-label="Habit notes"
            rows={2}
            className="w-full resize-none rounded-input border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}
    </form>
  );
}

export { HabitForm };
