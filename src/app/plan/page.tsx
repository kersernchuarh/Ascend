"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DayColumn } from "@/components/plan/day-column";
import { AtRiskList } from "@/components/plan/at-risk-list";
import { useDeliverables } from "@/state/deliverable-context";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useNow } from "@/domain/use-now";
import { createSeedCalendarEvents } from "@/data/dashboard";
import { atRiskDeliverables, weekDays } from "@/domain/plan";

/**
 * Plan: "when will I actually do this?" — not a general-purpose calendar
 * (PRODUCT_BLUEPRINT.md §11). Reads the same shared Task/Deliverable/Session
 * state Home and Work already read; nothing here is a second representation.
 * `CalendarEvent` stays read-only from seed this phase — real CRUD (enter
 * recurring commitments, drag/resize sessions) is a larger surface deferred
 * to a later Plan iteration, not something this phase's scope calls for.
 */
export default function PlanPage() {
  const { deliverables, status: deliverableStatus } = useDeliverables();
  const { tasks, status: taskStatus } = useTasks();
  const { sessions } = useSessions();
  const now = useNow();

  const ready = deliverableStatus === "ready" && taskStatus === "ready" && now != null;

  const events = useMemo(() => (now ? createSeedCalendarEvents(now) : []), [now]);
  const days = useMemo(() => (now ? weekDays(now) : []), [now]);
  const atRisk = useMemo(
    () => (now ? atRiskDeliverables(deliverables, tasks, sessions, events, now) : []),
    [deliverables, tasks, sessions, events, now]
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
                />
              ))}
            </div>
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
            <AtRiskList deliverables={atRisk} tasks={tasks} sessions={sessions} events={events} now={now ?? new Date()} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
