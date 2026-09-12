"use client";

import { PillBadge } from "@/components/shared/pill-badge";
import { cn } from "@/lib/utils";
import { formatDuration, formatTime, formatWeekdayShort } from "@/lib/format-date";
import { isOverdue, isSameDay, startOfDay } from "@/domain/time";
import { calendarEventOccurrenceOn, dayHasConflict, freeMinutesForDay, type FreeTimePreferences } from "@/domain/plan";
import { PILLARS } from "@/lib/pillars";
import type { CalendarEvent, Deliverable, StudySession, Task } from "@/domain/types";

type DayColumnProps = {
  day: Date;
  events: CalendarEvent[];
  tasks: Task[];
  deliverables: Deliverable[];
  sessions: StudySession[];
  now: Date;
  prefs: FreeTimePreferences;
  /** Whether this is the day currently selected in the week view above the
   *  fixed-schedule form — distinct from `isToday`, which is a calendar
   *  fact, not a UI selection. */
  isSelected?: boolean;
  onSelect?: () => void;
};

/**
 * One day of the week view: fixed events, due deliverables, scheduled
 * tasks, and a single real "free" number. Read-only by design — Plan
 * answers "when", not "what"; creating/editing tasks stays Work's and
 * Home's job (blueprint §11: "Must NOT contain: Task creation as primary
 * flow"). `CalendarEvent` editing lives in its own schedule section, not
 * inline here, since an event is weekly-recurring — editing it from one
 * day's column would misleadingly suggest a single-day change. Free time
 * and the conflict flag are only computed for today and future days — both
 * are forward-looking planning concepts that don't mean anything for a day
 * that's already happened.
 */
function DayColumn({ day, events, tasks, deliverables, sessions, now, prefs, isSelected, onSelect }: DayColumnProps) {
  const isToday = isSameDay(day, now);
  const isPast = startOfDay(day).getTime() < startOfDay(now).getTime();

  type DayEvent = { event: CalendarEvent; startAt: string };
  const dayEvents: DayEvent[] = events
    .flatMap((event) => {
      const occurrence = calendarEventOccurrenceOn(event, day);
      return occurrence ? [{ event, startAt: occurrence.startAt }] : [];
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const dueDeliverables = deliverables.filter(
    (deliverable) => deliverable.completedAt == null && isSameDay(new Date(deliverable.dueAt), day)
  );
  const scheduledTasks = tasks
    .filter((task) => task.scheduledFor && isSameDay(new Date(task.scheduledFor), day))
    .sort((a, b) => new Date(a.scheduledFor as string).getTime() - new Date(b.scheduledFor as string).getTime());

  const freeMinutes = isPast ? null : freeMinutesForDay(day, events, tasks, sessions, now, prefs);
  const conflict = !isPast && dayHasConflict(day, events, tasks);
  const nothingAtAll = dayEvents.length === 0 && dueDeliverables.length === 0 && scheduledTasks.length === 0;

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      aria-pressed={onSelect ? isSelected : undefined}
      className={cn(
        "flex flex-col gap-2 rounded-[10px] border p-3",
        onSelect && "cursor-pointer text-left transition-colors hover:border-[#2a3441]",
        isSelected ? "border-primary bg-primary/[0.04]" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-caption", isToday ? "text-primary" : "text-muted-foreground")}>
            {formatWeekdayShort(day)}
          </span>
          <span className={cn("text-body font-medium", isToday ? "text-primary" : "text-foreground")}>
            {day.getDate()}
          </span>
          {isToday ? <span className="size-1 rounded-full bg-primary" aria-hidden="true" /> : null}
        </div>
        {conflict ? <PillBadge color="red">Conflict</PillBadge> : null}
      </div>

      {freeMinutes != null ? (
        <p className="text-caption text-muted-foreground">{formatDuration(freeMinutes)} unscheduled</p>
      ) : null}

      {nothingAtAll ? (
        <p className="py-2 text-caption text-muted-foreground">Nothing scheduled</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {dayEvents.map(({ event, startAt }) => (
            <div key={event.id} className="text-caption text-muted-foreground">
              <span className="text-foreground">{event.title}</span> · {formatTime(startAt)}
            </div>
          ))}
          {dueDeliverables.map((deliverable) => (
            <PillBadge key={deliverable.id} color={isOverdue(deliverable.dueAt, now) ? "red" : "orange"}>
              Due: {deliverable.title}
            </PillBadge>
          ))}
          {scheduledTasks.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center gap-1.5">
              {task.pillar ? (
                <PillBadge color={PILLARS[task.pillar].color}>{PILLARS[task.pillar].label}</PillBadge>
              ) : null}
              <span
                className={cn(
                  "text-caption",
                  task.completedAt ? "text-muted-foreground line-through" : "text-foreground"
                )}
              >
                {task.title}
              </span>
              <span className="text-caption text-muted-foreground">{formatTime(task.scheduledFor as string)}</span>
            </div>
          ))}
        </div>
      )}

      {isSelected ? (
        <a
          href="#fixed-schedule"
          onClick={(event) => event.stopPropagation()}
          className="mt-auto flex items-center gap-1 pt-1 text-caption font-medium text-primary hover:underline"
        >
          + Add commitment
        </a>
      ) : null}
    </div>
  );
}

export { DayColumn };
