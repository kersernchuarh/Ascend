import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Play, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { TaskForm, type TaskFormInput } from "@/components/work/task-form";
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
  /** Defers the task out of today — clears `scheduledFor` only, never
   *  `dueAt` (PRODUCT_BLUEPRINT.md §29: deferring must never silently move
   *  a deadline). Named `onRemove` for the underlying action; the visible
   *  label is "Defer". */
  onRemove: () => void;
  /** Edits the task in place — the same form Work uses, reachable from
   *  Today too so stopping mid-task lets you record how much is actually
   *  left without leaving the page. */
  onUpdate: (input: TaskFormInput) => void;
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
  onUpdate,
}: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const pillar = task.pillar ? PILLARS[task.pillar] : undefined;
  const Icon = pillar?.icon;
  const dueAt = effectiveDueAt(task, deliverable);
  const isUrgent = dueAt ? deadlineRisk(dueAt, now) !== "on-track" : false;

  if (editing) {
    return (
      <li className="border-b border-border py-3 last:border-0">
        <TaskForm
          initialTask={task}
          fixedDeliverableId={task.deliverableId}
          onSubmit={(input) => {
            onUpdate(input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-2 border-b border-border py-3 last:border-0">
      <label className="flex min-w-0 flex-1 items-start gap-2">
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
            {pillar && Icon ? (
              <PillBadge color={pillar.color}>
                <Icon className="size-3" />
                {pillar.label}
              </PillBadge>
            ) : null}
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
          {task.notes ? (
            <LinkifiedText text={task.notes} className="text-caption text-muted-foreground" />
          ) : null}
        </div>
      </label>
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
        <Button variant="ghost" size="icon-xs" aria-label={`Edit "${task.title}"`} onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Defer "${task.title}" — keeps its deadline, moves it out of today`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export { TaskRow };
