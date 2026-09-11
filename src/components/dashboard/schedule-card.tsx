"use client";

import { useMemo } from "react";
import { CalendarClock, CalendarX2 } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useNow } from "@/domain/use-now";
import { calendarEventOccurrenceOn, freeBlocksForDay, wakingWindow } from "@/domain/plan";
import { formatDuration, formatTime } from "@/lib/format-date";
import type { CalendarEvent } from "@/domain/types";

const KIND_LABEL: Record<CalendarEvent["kind"], string> = {
  class: "Class",
  cca: "CCA",
  appointment: "Appointment",
  personal: "Personal",
};

/**
 * "How does today look?" — real fixed commitments only (classes, CCA,
 * appointments): the one thing nothing else on Home shows, since Today's
 * Plan already lists scheduled tasks with their own times inline. Repeating
 * that same task list here would be exactly the duplicate information this
 * phase's product direction rules out. Deliberately not a calendar: no week
 * view, no editing (that's `/plan`'s job) — just enough to orient.
 */
function ScheduleCard() {
  const { tasks, status: taskStatus } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { events, status: eventStatus } = useCalendarEvents();
  const { preferences, status: prefsStatus } = usePreferences();
  const now = useNow();

  const ready =
    taskStatus === "ready" &&
    sessionStatus === "ready" &&
    eventStatus === "ready" &&
    prefsStatus === "ready" &&
    now != null;

  const items = useMemo<{ startAt: string; event: CalendarEvent }[]>(() => {
    if (!now) return [];
    return events
      .flatMap((event) => {
        const occurrence = calendarEventOccurrenceOn(event, now);
        return occurrence ? [{ startAt: occurrence.startAt, event }] : [];
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [now, events]);

  // The free-time engine still accounts for scheduled tasks even though
  // they aren't listed above — this sentence is about real time available,
  // not just the gaps between fixed commitments.
  const gapGuidance = useMemo(() => {
    if (!now) return null;
    const blocks = freeBlocksForDay(now, events, tasks, sessions, now, preferences);
    const firstBlock = blocks[0];
    if (!firstBlock) return "No free time left in today's waking window";
    const minutes = Math.round(
      (new Date(firstBlock.endAt).getTime() - new Date(firstBlock.startAt).getTime()) / 60_000
    );
    if (minutes <= 0) return null;
    const window = wakingWindow(now, preferences);
    const isRestOfDay = new Date(firstBlock.endAt).getTime() >= new Date(window.endAt).getTime();
    return isRestOfDay
      ? `${formatDuration(minutes)} free for the rest of today`
      : `${formatDuration(minutes)} available before your next commitment`;
  }, [now, events, tasks, sessions, preferences]);

  return (
    <Card id="schedule" className="w-full scroll-mt-20" flat>
      <CardContent>
        <SectionHeader title="Schedule" description="Today's fixed commitments" />
        {!ready ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CalendarX2 className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">Nothing fixed on the calendar today</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col">
            {items.map(({ event, startAt }) => (
              <li key={event.id} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-body text-foreground">{event.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <PillBadge color="primary">{KIND_LABEL[event.kind]}</PillBadge>
                    <span className="text-caption text-muted-foreground">{formatTime(startAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {ready && gapGuidance ? (
          <p className="mt-3 text-caption text-muted-foreground">{gapGuidance}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { ScheduleCard };
