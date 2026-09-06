"use client";

import { ShieldCheck } from "lucide-react";
import { PillBadge } from "@/components/shared/pill-badge";
import { formatDuration, formatRelativeDay } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import { freeMinutesUntil, remainingEffortMinutes, workloadRisk, type WorkloadRisk } from "@/domain/plan";
import type { CalendarEvent, Deliverable, StudySession, Task } from "@/domain/types";

type AtRiskListProps = {
  /** Pre-filtered to at-risk by the caller (`domain/plan.atRiskDeliverables`). */
  deliverables: Deliverable[];
  tasks: Task[];
  sessions: StudySession[];
  events: CalendarEvent[];
  now: Date;
};

const RISK_LABEL: Partial<Record<WorkloadRisk, string>> = {
  overdue: "Overdue",
  "insufficient-time": "Not enough time",
  tight: "Tight",
};

/**
 * "Which upcoming deadlines are at risk?" — each row carries its own real
 * derivation (remaining effort vs. free time before the deadline), not just
 * a bare severity badge, per the blueprint's "every number traces to a
 * derivation" rule.
 */
function AtRiskList({ deliverables, tasks, sessions, events, now }: AtRiskListProps) {
  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <ShieldCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-body text-muted-foreground">Nothing at risk right now</p>
      </div>
    );
  }

  return (
    <ul>
      {deliverables.map((deliverable) => {
        const risk = workloadRisk(deliverable, tasks, sessions, events, now);
        const remaining = remainingEffortMinutes(deliverable, tasks, sessions) ?? 0;
        const available = Math.max(0, freeMinutesUntil(deliverable.dueAt, events, tasks, sessions, now));
        const pillar = PILLARS[deliverable.pillar];

        return (
          <li key={deliverable.id} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
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
            <PillBadge color="red">{RISK_LABEL[risk] ?? risk}</PillBadge>
          </li>
        );
      })}
    </ul>
  );
}

export { AtRiskList };
