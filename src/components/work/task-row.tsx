"use client";

import Link from "next/link";
import { Play, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { cn } from "@/lib/utils";
import { formatDuration, formatRelativeDay } from "@/lib/format-date";
import { deadlineRisk } from "@/domain/time";
import { effectiveDueAt } from "@/domain/work";
import { PILLARS } from "@/lib/pillars";
import type { Deliverable, Task } from "@/domain/types";

type WorkTaskRowProps = {
  task: Task;
  /** The task's linked deliverable, if any — used only to fall back to its
   *  due date when the task has none of its own (`domain/work.effectiveDueAt`). */
  deliverable?: Deliverable;
  now: Date;
  onToggle: () => void;
  onDelete: () => void;
};

/** Work's task row: no reorder (Work has no "today" ordering concept) and a
 *  real delete instead of Home's "remove from today" — see
 *  `components/dashboard/task-row.tsx` for the Today's Focus variant this
 *  deliberately doesn't share a component with (different action sets). */
function WorkTaskRow({ task, deliverable, now, onToggle, onDelete }: WorkTaskRowProps) {
  const pillar = PILLARS[task.pillar];
  const Icon = pillar.icon;
  const dueAt = effectiveDueAt(task, deliverable);
  const isUrgent = dueAt ? deadlineRisk(dueAt, now) !== "on-track" : false;

  return (
    <li className="flex items-start gap-2 border-b border-border py-2.5 last:border-0">
      <Checkbox
        checked={!!task.completedAt}
        onCheckedChange={onToggle}
        aria-label={task.completedAt ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        className="mt-[3px] shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={cn(
            "text-body transition-colors duration-200",
            task.completedAt ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <PillBadge color={pillar.color}>
            <Icon className="size-3" />
            {pillar.label}
          </PillBadge>
          {task.estimateMinutes ? (
            <span className="text-caption text-muted-foreground">~{formatDuration(task.estimateMinutes)}</span>
          ) : null}
          {dueAt ? (
            isUrgent ? (
              <PillBadge color="red">{formatRelativeDay(dueAt, now)}</PillBadge>
            ) : (
              <span className="text-caption text-muted-foreground">Due {formatRelativeDay(dueAt, now)}</span>
            )
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon-xs" aria-label={`Start a focus session for "${task.title}"`} asChild>
          <Link href={`/focus?task=${task.id}`}>
            <Play className="size-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label={`Delete "${task.title}"`} onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export { WorkTaskRow };
