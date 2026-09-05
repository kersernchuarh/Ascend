"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { WorkTaskRow } from "@/components/work/task-row";
import { CreateTaskForm } from "@/components/work/create-task-form";
import { cn } from "@/lib/utils";
import { formatDuration, formatRelativeDay } from "@/lib/format-date";
import { deadlineRisk } from "@/domain/time";
import { deliverableTaskProgress, loggedMinutesForDeliverable, tasksForDeliverable } from "@/domain/work";
import { PILLARS } from "@/lib/pillars";
import type { Deliverable, StudySession, Task } from "@/domain/types";

type DeliverableRowProps = {
  deliverable: Deliverable;
  /** The full task list — filtered internally to this deliverable's own
   *  tasks, so the caller doesn't need to pre-slice it per row. */
  tasks: Task[];
  sessions: StudySession[];
  now: Date;
  onToggle: () => void;
  onDelete: () => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (input: Omit<Task, "id" | "createdAt">) => void;
};

/**
 * One deliverable, expandable to its own nested tasks. "Logged" minutes and
 * "N/M tasks" are both real derivations (`domain/work.ts`) — never a
 * progress percentage, since a fabricated-feeling bar was exactly what this
 * phase's product direction ruled out (Step 9).
 */
function DeliverableRow({
  deliverable,
  tasks,
  sessions,
  now,
  onToggle,
  onDelete,
  onToggleTask,
  onDeleteTask,
  onCreateTask,
}: DeliverableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const pillar = PILLARS[deliverable.pillar];
  const Icon = pillar.icon;
  const isUrgent = deliverable.completedAt == null && deadlineRisk(deliverable.dueAt, now) !== "on-track";
  const linkedTasks = tasksForDeliverable(tasks, deliverable.id);
  const { done, total } = deliverableTaskProgress(tasks, deliverable.id);
  const loggedMinutes = loggedMinutesForDeliverable(sessions, tasks, deliverable.id);

  return (
    <li className="border-b border-border py-3 last:border-0">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={!!deliverable.completedAt}
          onCheckedChange={onToggle}
          aria-label={
            deliverable.completedAt
              ? `Mark "${deliverable.title}" not submitted`
              : `Mark "${deliverable.title}" submitted`
          }
          className="mt-[3px] shrink-0"
        />
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "text-body transition-colors duration-200",
                deliverable.completedAt ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {deliverable.title}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <PillBadge color={pillar.color}>
                <Icon className="size-3" />
                {pillar.label}
              </PillBadge>
              {isUrgent ? (
                <PillBadge color="red">{formatRelativeDay(deliverable.dueAt, now)}</PillBadge>
              ) : (
                <span className="text-caption text-muted-foreground">
                  Due {formatRelativeDay(deliverable.dueAt, now)}
                </span>
              )}
              {deliverable.estimateMinutes ? (
                <span className="text-caption text-muted-foreground">
                  ~{formatDuration(deliverable.estimateMinutes)} est.
                </span>
              ) : null}
              {loggedMinutes > 0 ? (
                <span className="text-caption text-muted-foreground">{formatDuration(loggedMinutes)} logged</span>
              ) : null}
              {total > 0 ? (
                <span className="text-caption text-muted-foreground">
                  {done}/{total} tasks
                </span>
              ) : null}
            </div>
          </div>
          <span className="mt-1 shrink-0 text-muted-foreground">
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Delete "${deliverable.title}"`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {expanded ? (
        <div className="mt-2 ml-6 flex flex-col gap-2">
          {deliverable.description ? (
            <p className="whitespace-pre-wrap text-caption text-muted-foreground">{deliverable.description}</p>
          ) : null}
          {linkedTasks.length > 0 ? (
            <ul>
              {linkedTasks.map((task) => (
                <WorkTaskRow
                  key={task.id}
                  task={task}
                  deliverable={deliverable}
                  now={now}
                  onToggle={() => onToggleTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-1 text-caption text-muted-foreground">No tasks yet.</p>
          )}
          <CreateTaskForm onCreate={onCreateTask} fixedDeliverableId={deliverable.id} />
        </div>
      ) : null}
    </li>
  );
}

export { DeliverableRow };
