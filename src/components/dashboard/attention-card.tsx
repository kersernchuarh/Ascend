"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ListPlus } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/state/task-context";
import { useDeliverables } from "@/state/deliverable-context";
import { useSessions } from "@/state/session-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useNow } from "@/domain/use-now";
import { isDueToday } from "@/domain/time";
import {
  atRiskDeliverables,
  dayHasConflict,
  freeMinutesUntil,
  remainingEffortMinutes,
  workloadRisk,
  type FreeTimePreferences,
  type WorkloadRisk,
} from "@/domain/plan";
import { formatDuration, formatRelativeDay } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import type { CalendarEvent, Deliverable, StudySession, Task } from "@/domain/types";

const RISK_LABEL: Partial<Record<WorkloadRisk, string>> = {
  overdue: "Overdue",
  "insufficient-time": "Not enough time",
  tight: "Tight",
};

/**
 * "What genuinely needs my attention?" — replaces Upcoming's plain deadline
 * list. Every row here carries a concrete, derived reason (never an
 * arbitrary color): real overdue/at-risk status from `domain/plan.workloadRisk`
 * (the same effort-vs-free-time engine `/plan`'s At risk panel uses), plus a
 * schedule-conflict flag when one is real today. Each row can pull the
 * deliverable's next outstanding task into today's plan directly — reusing
 * the exact canonical `updateTask(scheduledFor)` path `AddExistingTaskRow`
 * already uses, never inventing a second representation of "today's plan".
 */
function AttentionCard() {
  const { tasks, updateTask, status: taskStatus } = useTasks();
  const { deliverables, status: deliverableStatus } = useDeliverables();
  const { sessions, status: sessionStatus } = useSessions();
  const { events, status: eventStatus } = useCalendarEvents();
  const { preferences, status: prefsStatus } = usePreferences();
  const now = useNow();

  const ready =
    taskStatus === "ready" &&
    deliverableStatus === "ready" &&
    sessionStatus === "ready" &&
    eventStatus === "ready" &&
    prefsStatus === "ready" &&
    now != null;

  const flagged = useMemo(() => {
    if (!now) return [];
    const outstanding = deliverables.filter((d) => d.completedAt == null);
    const atRisk = atRiskDeliverables(outstanding, tasks, sessions, events, now, preferences);
    // Overdue first, then soonest-due, matching the urgency the risk itself
    // implies rather than an arbitrary insertion order.
    return [...atRisk].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [deliverables, tasks, sessions, events, preferences, now]);

  const conflictToday = ready && now ? dayHasConflict(now, events, tasks) : false;
  // Nothing to say and nothing to show — the whole card recedes rather than
  // taking up a screen's worth of space to announce "all clear" (this
  // phase's product direction: an empty-but-fine state shouldn't compete
  // with the sections that actually have something to say).
  const nothingToReport = ready && flagged.length === 0 && !conflictToday;

  if (nothingToReport) return null;

  return (
    <Card id="attention" className="w-full scroll-mt-20" flat>
      <CardContent>
        <SectionHeader title="Attention" description="Where the numbers don't add up" />
        {!ready || !now ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-14 w-full rounded-[10px]" />
            <Skeleton className="h-14 w-full rounded-[10px]" />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-1">
            {conflictToday ? (
              <Link
                href="/plan"
                className="flex items-center gap-2 border-b border-border py-3 text-body text-foreground last:border-0 hover:text-primary"
              >
                <CalendarClock className="size-4 shrink-0 text-orange" />
                Your schedule overlaps today
              </Link>
            ) : null}
            {flagged.map((deliverable) => (
              <AttentionRow
                key={deliverable.id}
                deliverable={deliverable}
                tasks={tasks}
                sessions={sessions}
                events={events}
                now={now}
                prefs={preferences}
                onAddToToday={(taskId) => updateTask(taskId, { scheduledFor: now.toISOString() })}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttentionRow({
  deliverable,
  tasks,
  sessions,
  events,
  now,
  prefs,
  onAddToToday,
}: {
  deliverable: Deliverable;
  tasks: Task[];
  sessions: StudySession[];
  events: CalendarEvent[];
  now: Date;
  prefs: FreeTimePreferences;
  onAddToToday: (taskId: string) => void;
}) {
  const risk = workloadRisk(deliverable, tasks, sessions, events, now, prefs);
  const remaining = remainingEffortMinutes(deliverable, tasks, sessions) ?? 0;
  const available = Math.max(0, freeMinutesUntil(deliverable.dueAt, events, tasks, sessions, now, prefs));
  const pillar = PILLARS[deliverable.pillar];

  // The deliverable's own earliest outstanding task not already part of
  // today's plan — what "add to today" actually schedules. Nothing renders
  // the action at all when there's genuinely nothing eligible to add,
  // rather than showing a button that would do nothing.
  const nextTask = tasks.find(
    (task) =>
      task.deliverableId === deliverable.id &&
      task.completedAt == null &&
      !(task.scheduledFor && isDueToday(task.scheduledFor, now))
  );

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <PillBadge color={pillar.color}>{pillar.label}</PillBadge>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body text-foreground">{deliverable.title}</span>
        <span className="text-caption text-muted-foreground">
          {risk === "overdue"
            ? `Was due ${formatRelativeDay(deliverable.dueAt, now)}`
            : `${formatDuration(remaining)} remaining · ${formatDuration(available)} free before ${formatRelativeDay(
                deliverable.dueAt,
                now
              )}`}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <PillBadge color="red">
          <AlertTriangle className="size-3" />
          {RISK_LABEL[risk] ?? risk}
        </PillBadge>
        {nextTask ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-caption text-muted-foreground"
            onClick={() => onAddToToday(nextTask.id)}
          >
            <ListPlus className="size-3.5" />
            Add to today
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { AttentionCard };
