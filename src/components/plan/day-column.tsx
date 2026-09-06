"use client";

import { CalendarCheck } from "lucide-react";
import { PillBadge } from "@/components/shared/pill-badge";
import { cn } from "@/lib/utils";
import { formatDuration, formatTime, formatWeekdayShort } from "@/lib/format-date";
import { isOverdue, isSameDay, startOfDay } from "@/domain/time";
import { dayHasConflict, freeMinutesForDay } from "@/domain/plan";
import { PILLARS } from "@/lib/pillars";
import type { CalendarEvent, Deliverable, StudySession, Task } from "@/domain/types";

type DayColumnProps = {
  day: Date;
  events: CalendarEvent[];
  tasks: Task[];
  deliverables: Deliverable[];
  sessions: StudySession[];
  now: Date;
};

/**
 * One day of the week view: fixed events, due deliverables, scheduled
 * tasks, and a single real "free" number. Read-only by design — Plan
 * answers "when", not "what"; creating/editing tasks stays Work's and
 * Home's job (blueprint §11: "Must NOT contain: Task creation as primary
 * flow"). Free time and the conflict flag are only computed for today and
 * future days — both are forward-looking planning concepts that don't mean
 * anything for a day that's already happened.
 */
function DayColumn({ day, events, tasks, deliverables, sessions, now }: DayColumnProps) {
  const isToday = isSameDay(day, now);
  const isPast = startOfDay(day).getTime() < startOfDay(now).getTime();

  const dayEvents = events
    .filter((event) => isSameDay(new Date(event.startAt), day))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const dueDeliverables = deliverables.filter(
    (deliverable) => deliverable.completedAt == null && isSameDay(new Date(deliverable.dueAt), day)
  );
  const scheduledTasks = tasks
    .filter((task) => task.scheduledFor && isSameDay(new Date(task.scheduledFor), day))
    .sort((a, b) => new Date(a.scheduledFor as string).getTime() - new Date(b.scheduledFor as string).getTime());

  const freeMinutes = isPast ? null : freeMinutesForDay(day, events, tasks, sessions, now);
  const conflict = !isPast && dayHasConflict(day, events, tasks);
  const nothingAtAll = dayEvents.length === 0 && dueDeliverables.length === 0 && scheduledTasks.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[10px] border border-border p-3",
        isToday && "border-primary"
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
        </div>
        {conflict ? <PillBadge color="red">Conflict</PillBadge> : null}
      </div>

      {freeMinutes != null ? (
        <p className="text-caption text-muted-foreground">{formatDuration(freeMinutes)} free</p>
      ) : null}

      {nothingAtAll ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center">
          <CalendarCheck className="size-4 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-caption text-muted-foreground">Nothing scheduled</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {dayEvents.map((event) => (
            <div key={event.id} className="text-caption text-muted-foreground">
              <span className="text-foreground">{event.title}</span> · {formatTime(event.startAt)}
            </div>
          ))}
          {dueDeliverables.map((deliverable) => (
            <PillBadge key={deliverable.id} color={isOverdue(deliverable.dueAt, now) ? "red" : "orange"}>
              Due: {deliverable.title}
            </PillBadge>
          ))}
          {scheduledTasks.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center gap-1.5">
              <PillBadge color={PILLARS[task.pillar].color}>{PILLARS[task.pillar].label}</PillBadge>
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
    </div>
  );
}

export { DayColumn };
