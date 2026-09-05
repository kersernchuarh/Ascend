"use client";

import { useMemo } from "react";
import { ClipboardCheck, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "@/components/dashboard/task-row";
import { AddTaskRow } from "@/components/dashboard/add-task-row";
import { AddExistingTaskRow } from "@/components/dashboard/add-existing-task-row";
import { useTasks } from "@/state/task-context";
import { useDeliverables } from "@/state/deliverable-context";
import { useNow } from "@/domain/use-now";
import { isDueToday } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";

function TodaysFocusCard() {
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
  const now = useNow();

  // Same shared `DeliverableProvider` state Work reads and writes — editing
  // a deliverable's due date there is reflected here immediately, with no
  // separate representation to fall out of sync (PRODUCT_BLUEPRINT.md §7.2).
  const deliverableById = useMemo(
    () => new Map(deliverables.map((d) => [d.id, d])),
    [deliverables]
  );

  // The Work backlog: real, incomplete tasks not already part of today's
  // plan — what `AddExistingTaskRow` lets the user pull in without
  // recreating them (Home/Work sync, the other direction from `addTask`).
  const backlogTasks = useMemo(() => {
    if (!now) return [];
    return allTasks.filter(
      (task) => !task.completedAt && !(task.scheduledFor && isDueToday(task.scheduledFor, now))
    );
  }, [allTasks, now]);

  const allDone = status === "ready" && tasks.length > 0 && completedCount === tasks.length;

  function handleAdd(title: string, pillar: PillarId) {
    if (!now) return;
    addTask({ title, pillar, scheduledFor: now.toISOString() });
  }

  function handleScheduleExisting(id: string) {
    if (!now) return;
    updateTask(id, { scheduledFor: now.toISOString() });
  }

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader
          level={2}
          title="Today's Focus"
          description={status === "ready" ? `${completedCount}/${tasks.length} completed` : undefined}
        />
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
            <PartyPopper className="size-6 text-primary" strokeWidth={1.5} />
            <p className="text-body text-foreground">All done for today</p>
            <p className="text-caption text-muted-foreground">
              Add another task below if there&apos;s more to do.
            </p>
          </div>
        ) : (
          <ul className="mt-4 max-h-[420px] overflow-y-auto">
            {tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                deliverable={task.deliverableId ? deliverableById.get(task.deliverableId) : undefined}
                now={now ?? new Date()}
                isFirst={index === 0}
                isLast={index === tasks.length - 1}
                onToggle={() => toggleTask(task.id)}
                onMoveUp={() => moveTaskInToday(task.id, "up")}
                onMoveDown={() => moveTaskInToday(task.id, "down")}
                onRemove={() => removeFromToday(task.id)}
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
    </Card>
  );
}

export { TodaysFocusCard };
