"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/domain/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const KIND_OPTIONS: { value: CalendarEvent["kind"]; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "cca", label: "CCA" },
  { value: "appointment", label: "Appointment" },
  { value: "personal", label: "Personal" },
];

export type EventFormInput = Omit<CalendarEvent, "id" | "createdAt">;

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeStringToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

type EventFormProps = {
  /** Pass an existing event to edit it in place, pre-filled. */
  initialEvent?: CalendarEvent;
  /** The day this form should default to for a *new* commitment — set when
   *  the user picks a specific day in the week view above, so the
   *  destination of "Add commitment" is unambiguous. Only ever read once,
   *  as this component's initial state: the caller (`app/plan/page.tsx`)
   *  changes this component's `key` alongside the selected day, so picking
   *  a different day remounts the form with the new default rather than
   *  needing an effect to resync it — the same reset that clearing any
   *  other in-progress, day-specific draft on a day switch would call for. */
  initialDayOfWeek?: number;
  onSubmit: (input: EventFormInput) => void;
  onCancel?: () => void;
};

/**
 * A fixed commitment's create/edit form. All fields are shown at once
 * (no progressive disclosure): unlike a task or habit, a commitment isn't
 * meaningful with only a title — day, time and duration are exactly as
 * required as the name, so hiding them behind "More" would just add a step
 * before the fast path actually works.
 */
function EventForm({ initialEvent, initialDayOfWeek, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(initialEvent?.dayOfWeek ?? initialDayOfWeek ?? 1);
  const [startTime, setStartTime] = useState(minutesToTimeString(initialEvent?.startMinutes ?? 8 * 60));
  const [durationMinutes, setDurationMinutes] = useState(initialEvent?.durationMinutes ?? 60);
  const [kind, setKind] = useState<CalendarEvent["kind"]>(initialEvent?.kind ?? "class");

  const canSubmit = title.trim().length > 0 && durationMinutes > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      kind,
      dayOfWeek,
      startMinutes: timeStringToMinutes(startTime),
      durationMinutes,
    });
    if (!initialEvent) {
      setTitle("");
      setDayOfWeek(1);
      setStartTime("08:00");
      setDurationMinutes(60);
      setKind("class");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-caption text-muted-foreground">
          Commitment
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Morning classes"
            aria-label="Event title"
          />
        </label>
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Start time
          <Input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            aria-label="Start time"
            className="w-[120px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Duration (min)
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={5}
              step={5}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Math.max(5, Number(event.target.value) || 5))}
              aria-label="Duration in minutes"
              className="w-20"
            />
            <span className="text-caption text-muted-foreground">min</span>
          </div>
        </label>
        <Button
          type="submit"
          size={initialEvent ? "sm" : "sm"}
          className="gap-1.5"
          aria-label={initialEvent ? "Save changes" : "Add fixed commitment"}
          disabled={!canSubmit}
        >
          {initialEvent ? (
            "Save"
          ) : (
            <>
              <Plus className="size-4" />
              Add
            </>
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="radiogroup" aria-label="Day of week">
          {DAY_LABELS.map((label, day) => (
            <button
              key={day}
              type="button"
              role="radio"
              aria-checked={dayOfWeek === day}
              aria-label={DAY_NAMES[day]}
              onClick={() => setDayOfWeek(day)}
              className={cn(
                "flex size-7 items-center justify-center rounded-[8px] border text-caption transition-colors",
                dayOfWeek === day
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-[#2a3441]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={kind === option.value}
              onClick={() => setKind(option.value)}
              className={cn(
                "h-7 rounded-[8px] border px-2.5 text-caption font-medium transition-colors",
                kind === option.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-[#2a3441] hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

export { EventForm };
