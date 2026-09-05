import Link from "next/link";
import { ChevronDown, ChevronUp, Play, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { cn } from "@/lib/utils";
import { formatDuration, formatRelativeDay, formatTime } from "@/lib/format-date";
import { deadlineRisk } from "@/domain/time";
import { effectiveDueAt } from "@/domain/work";
import { PILLARS } from "@/lib/pillars";
import type { Deliverable, Task } from "@/domain/types";

type TaskRowProps = {
  task: Task;
  /** The `Deliverable` this task links to via `deliverableId`, if any —
   *  resolved by the caller (both Home trees already load deliverables for
   *  the Upcoming card, so this avoids each row re-deriving it
   *  independently). Due info shown here is the task's own `dueAt` when set,
   *  else this deliverable's (`domain/work.effectiveDueAt`). */
  deliverable?: Deliverable;
  now: Date;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

/**
 * Shared between desktop's `TodaysFocusCard` and mobile's task list — the
 * row grew real interactive surface (reorder, remove, start-session) this
 * pass, and duplicating that in two places would be a maintenance trap.
 * Actions are always visible rather than hover-revealed: a hover-only
 * affordance is invisible by construction on touch, which would make
 * mobile's identical row silently lose functionality desktop keeps.
 */
function TaskRow({
  task,
  deliverable,
  now,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
}: TaskRowProps) {
  const pillar = PILLARS[task.pillar];
  const Icon = pillar.icon;
  const dueAt = effectiveDueAt(task, deliverable);
  const isUrgent = dueAt ? deadlineRisk(dueAt, now) !== "on-track" : false;

  return (
    <li className="group flex items-start gap-2 border-b border-border py-3 last:border-0">
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
          {task.scheduledFor ? (
            <span className="text-caption text-muted-foreground">
              {formatTime(task.scheduledFor)}
            </span>
          ) : null}
          {task.estimateMinutes ? (
            <span className="text-caption text-muted-foreground">
              ~{formatDuration(task.estimateMinutes)}
            </span>
          ) : null}
          {dueAt ? (
            isUrgent ? (
              <PillBadge color="red">{formatRelativeDay(dueAt, now)}</PillBadge>
            ) : (
              <span className="text-caption text-muted-foreground">
                Due {formatRelativeDay(dueAt, now)}
              </span>
            )
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Move "${task.title}" up`}
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Move "${task.title}" down`}
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label={`Start a focus session for "${task.title}"`} asChild>
          <Link href={`/focus?task=${task.id}`}>
            <Play className="size-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove "${task.title}" from today`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export { TaskRow };
