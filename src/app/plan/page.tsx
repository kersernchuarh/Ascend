"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DayColumn } from "@/components/plan/day-column";
import { AtRiskList } from "@/components/plan/at-risk-list";
import { EventForm } from "@/components/plan/event-form";
import { ScheduleList } from "@/components/plan/schedule-list";
import { useDeliverables } from "@/state/deliverable-context";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useNow } from "@/domain/use-now";
import { atRiskDeliverables, weekDays } from "@/domain/plan";

/**
 * Plan: "when will I actually do this?" — not a general-purpose calendar
 * (PRODUCT_BLUEPRINT.md §11). Reads the same shared Task/Deliverable/Session
 * state Home and Work already read, plus (as of the "make Plan tell the
 * truth" phase) real, persisted `CalendarEvent`s and `UserPreferences` —
 * the week view and every risk number below are now computed from a real
 * user's real week, not seed data.
 */
export default function PlanPage() {
  const { deliverables, status: deliverableStatus } = useDeliverables();
  const { tasks, status: taskStatus } = useTasks();
  const { sessions } = useSessions();
  const { events, status: eventStatus, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { preferences, status: prefsStatus } = usePreferences();
  const now = useNow();

  const ready =
    deliverableStatus === "ready" &&
    taskStatus === "ready" &&
    eventStatus === "ready" &&
    prefsStatus === "ready" &&
    now != null;

  const days = useMemo(() => (now ? weekDays(now) : []), [now]);
  const atRisk = useMemo(
    () => (now ? atRiskDeliverables(deliverables, tasks, sessions, events, now, preferences) : []),
    [deliverables, tasks, sessions, events, preferences, now]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            level={2}
            title="This week"
            description="Fixed events, scheduled work, and how much time is actually left"
          />
          {!ready ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-7" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-[10px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-7">
              {days.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  events={events}
                  tasks={tasks}
                  deliverables={deliverables}
                  sessions={sessions}
                  now={now}
                  prefs={preferences}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Your fixed schedule" description="Classes, CCAs, and appointments that repeat every week" />
          {!ready ? (
            <Skeleton className="h-16 w-full rounded-[10px]" aria-hidden="true" />
          ) : (
            <>
              <EventForm onSubmit={(input) => addEvent(input)} />
              <ScheduleList
                events={events}
                onUpdate={(id, input) => updateEvent(id, input)}
                onDelete={(id) => deleteEvent(id)}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="At risk" description="Deadlines where the numbers don't add up" />
          {!ready ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-16 w-full rounded-[10px]" />
              <Skeleton className="h-16 w-full rounded-[10px]" />
            </div>
          ) : (
            <AtRiskList
              deliverables={atRisk}
              tasks={tasks}
              sessions={sessions}
              events={events}
              now={now ?? new Date()}
              prefs={preferences}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
