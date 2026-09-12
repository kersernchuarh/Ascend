"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Pause, Play, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "@/components/dashboard/task-row";
import { AddTaskRow, type QuickCaptureInput } from "@/components/dashboard/add-task-row";
import { AddExistingTaskRow } from "@/components/dashboard/add-existing-task-row";
import { UndoToast, type UndoableAction } from "@/components/shared/undo-toast";
import { useTasks } from "@/state/task-context";
import { useDeliverables } from "@/state/deliverable-context";
import { useSessions } from "@/state/session-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useActiveSession } from "@/state/active-session-context";
import { useNow } from "@/domain/use-now";
import { isDueToday } from "@/domain/time";
import { freeMinutesForDay } from "@/domain/plan";
import { formatDuration } from "@/lib/format-date";

/**
 * The centerpiece of Home — merges the old `NowPanel` (the "what do I do
 * right now" entry point) and `TodaysFocusCard` (the actual plan) into one
 * section, per the Home v2 redesign. The top row is now genuinely
 * state-driven rather than a permanent hero: a running Focus session takes
 * over this space because it *is* the current activity; otherwise it's a
 * single contextual line, not a dominant CTA (PRODUCT_BLUEPRINT.md §9.2,
 * revised — a timer should not outrank the plan itself when nothing is
 * actually running).
 */
function TodayPlanCard() {
  const {
    tasks: allTasks,
    todayTasks: tasks,
    completedCount,
    toggleTask,
    status,
    addTask,
    updateTask,
    moveTaskInToday,
    removeFromToday,
  } = useTasks();
  const { deliverables } = useDeliverables();
  const { sessions } = useSessions();
  const { events } = useCalendarEvents();
  const { preferences } = usePreferences();
  const { session, secondsLeft: activeSecondsLeft } = useActiveSession();
  const now = useNow();
  const [lastAction, setLastAction] = useState<UndoableAction | null>(null);

  const deliverableById = useMemo(
    () => new Map(deliverables.map((d) => [d.id, d])),
    [deliverables]
  );

  const backlogTasks = useMemo(() => {
    if (!now) return [];
    return allTasks.filter(
      (task) => !task.completedAt && !(task.scheduledFor && isDueToday(task.scheduledFor, now))
    );
  }, [allTasks, now]);

  const allDone = status === "ready" && tasks.length > 0 && completedCount === tasks.length;
  const nextTask = tasks.find((task) => !task.completedAt);
  const activeTask = session?.taskId ? allTasks.find((t) => t.id === session.taskId) : undefined;

  // The same real minutes-vs-plan comparison the old strip showed, now
  // expressed as guidance rather than two bare numbers side by side — "You
  // have enough time" / "X over your available time", never a raw
  // "Free today: N min" headline (this phase's explicit product direction).
  const fitMessage = useMemo(() => {
    if (!now || status !== "ready") return null;
    const plannedMinutes = tasks
      .filter((task) => !task.completedAt)
      .reduce((sum, task) => sum + (task.estimateMinutes ?? 0), 0);
    if (plannedMinutes === 0) return null;
    const freeMinutes = freeMinutesForDay(now, events, allTasks, sessions, now, preferences);
    if (plannedMinutes > freeMinutes) {
      return { text: `Your plan is ${formatDuration(plannedMinutes - freeMinutes)} over your available time`, tight: true };
    }
    return { text: "You have enough time for today's plan", tight: false };
  }, [tasks, allTasks, sessions, events, preferences, now, status]);

  function handleAdd(input: QuickCaptureInput) {
    if (!now) return;
    addTask({ ...input, scheduledFor: now.toISOString() });
  }

  function handleScheduleExisting(id: string) {
    if (!now) return;
    updateTask(id, { scheduledFor: now.toISOString() });
  }

  return (
    <Card className="w-full" emphasis>
      <CardContent>
        {session ? (
          <ActiveSessionBanner taskTitle={activeTask?.title} secondsLeft={activeSecondsLeft} isRunning={session.isRunning} />
        ) : nextTask ? (
          <Link
            href={`/focus?task=${nextTask.id}`}
            className="mb-4 flex flex-col gap-2 rounded-[10px] border border-border bg-surface-2 px-4 py-3 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <span className="min-w-0 text-body text-foreground sm:flex-1 sm:truncate">
              <span className="text-muted-foreground">Up next — </span>
              {nextTask.title}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-caption font-medium text-primary">
              <Play className="size-3.5" />
              Start Focus
            </span>
          </Link>
        ) : allDone ? (
          <p className="mb-4 flex items-center gap-1.5 text-body text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Everything&apos;s done for today
          </p>
        ) : null}

        <SectionHeader
          level={2}
          title="Today's Plan"
          description={status === "ready" ? `${completedCount}/${tasks.length} completed` : undefined}
        />
        <p className="mt-1 text-caption text-muted-foreground">
          You choose what&apos;s on today — Ascend doesn&apos;t build a schedule for you yet, only warns if it looks like too much.
        </p>
        {fitMessage ? (
          <p
            className={
              "mt-3 flex items-center gap-1.5 text-caption " +
              (fitMessage.tight ? "text-orange" : "text-muted-foreground")
            }
          >
            {fitMessage.tight ? <AlertTriangle className="size-3.5 shrink-0" /> : <Sparkles className="size-3.5 shrink-0" />}
            {fitMessage.text}
          </p>
        ) : null}
        {status === "loading" ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-14 w-full rounded-[10px]" />
            <Skeleton className="h-14 w-full rounded-[10px]" />
            <Skeleton className="h-14 w-full rounded-[10px]" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <ClipboardCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">Nothing on your plate today</p>
          </div>
        ) : allDone ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <ClipboardCheck className="size-6 text-primary" strokeWidth={1.5} />
            <p className="text-caption text-muted-foreground">Add another task below if there&apos;s more to do.</p>
          </div>
        ) : (
          <ul className="mt-4 md:max-h-[420px] md:overflow-y-auto">
            {tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                deliverable={task.deliverableId ? deliverableById.get(task.deliverableId) : undefined}
                now={now ?? new Date()}
                isFirst={index === 0}
                isLast={index === tasks.length - 1}
                onToggle={() => {
                  const wasIncomplete = !task.completedAt;
                  toggleTask(task.id);
                  setLastAction(
                    wasIncomplete
                      ? { message: `Completed "${task.title}"`, undo: () => toggleTask(task.id) }
                      : null
                  );
                }}
                onMoveUp={() => moveTaskInToday(task.id, "up")}
                onMoveDown={() => moveTaskInToday(task.id, "down")}
                onRemove={() => {
                  const previousScheduledFor = task.scheduledFor;
                  removeFromToday(task.id);
                  setLastAction({
                    message: `Deferred "${task.title}" — its deadline is unchanged`,
                    undo: () => updateTask(task.id, { scheduledFor: previousScheduledFor }),
                  });
                }}
                onUpdate={(input) => updateTask(task.id, input)}
              />
            ))}
          </ul>
        )}
        {status === "ready" ? (
          <>
            <AddTaskRow onAdd={handleAdd} />
            <AddExistingTaskRow backlogTasks={backlogTasks} onSchedule={handleScheduleExisting} />
          </>
        ) : null}
      </CardContent>
      {lastAction ? <UndoToast action={lastAction} onDismiss={() => setLastAction(null)} /> : null}
    </Card>
  );
}

/**
 * Takes over the top of Today's Plan because it *is* the current activity —
 * the one case where Home is allowed to feel like a live timer rather than
 * a plan. Shows real, ticking state from the shared `ActiveSessionContext`,
 * not a duplicate countdown implementation.
 */
function ActiveSessionBanner({
  taskTitle,
  secondsLeft,
  isRunning,
}: {
  taskTitle?: string;
  secondsLeft: number;
  isRunning: boolean;
}) {
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const minutesRemaining = Math.ceil(secondsLeft / 60);
  return (
    <Link
      href="/focus"
      className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-primary bg-primary/10 px-4 py-3 transition-colors hover:bg-primary/15"
    >
      <span className="flex min-w-0 items-center gap-2 text-body text-foreground">
        {isRunning ? <Play className="size-4 shrink-0 text-primary" /> : <Pause className="size-4 shrink-0 text-primary" />}
        <span className="min-w-0 truncate">
          <span className="text-muted-foreground">{isRunning ? "Focusing on — " : "Paused — "}</span>
          {taskTitle ?? "Free focus session"}
        </span>
      </span>
      <span className="shrink-0 text-body font-medium tabular-nums text-primary" aria-hidden="true">
        {minutes}:{seconds}
      </span>
      {/* Coarse, minute-granularity announcement — not every second (§22
          item 7); only actually changes (and is only actually announced)
          once the whole-minute value crosses a boundary. */}
      <span className="sr-only" aria-live="polite">
        {minutesRemaining} minute{minutesRemaining === 1 ? "" : "s"} remaining
      </span>
    </Link>
  );
}

export { TodayPlanCard };
