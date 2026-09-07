"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm, type EventFormInput } from "@/components/plan/event-form";
import { formatDuration } from "@/lib/format-date";
import type { CalendarEvent } from "@/domain/types";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatStartTime(minutes: number): string {
  const reference = new Date(2000, 0, 1, 0, minutes);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(reference);
}

type ScheduleListProps = {
  events: CalendarEvent[];
  onUpdate: (id: string, input: EventFormInput) => void;
  onDelete: (id: string) => void;
};

/** The source-of-truth editor for fixed commitments — every one Plan's week
 *  view and the free-time engine actually read, listed day-by-day so it
 *  doubles as "does my real week look right". */
function ScheduleList({ events, onUpdate, onDelete }: ScheduleListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (events.length === 0) {
    return <p className="py-6 text-center text-body text-muted-foreground">No fixed commitments yet</p>;
  }

  const sorted = [...events].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes);

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((event) => {
        if (editingId === event.id) {
          return (
            <li key={event.id} className="rounded-[10px] border border-border p-3">
              <EventForm
                initialEvent={event}
                onSubmit={(input) => {
                  onUpdate(event.id, input);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          );
        }
        return (
          <li key={event.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
            <span className="w-10 shrink-0 text-caption text-muted-foreground">{DAY_SHORT[event.dayOfWeek]}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body text-foreground">{event.title}</span>
              <span className="text-caption text-muted-foreground">
                {formatStartTime(event.startMinutes)} · {formatDuration(event.durationMinutes)}
              </span>
            </div>
            <Button variant="ghost" size="icon-xs" aria-label={`Edit "${event.title}"`} onClick={() => setEditingId(event.id)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label={`Delete "${event.title}"`} onClick={() => onDelete(event.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export { ScheduleList };
