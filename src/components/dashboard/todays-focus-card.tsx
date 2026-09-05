"use client";

import { useMemo } from "react";
import { ClipboardCheck, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "@/components/dashboard/task-row";
import { AddTaskRow } from "@/components/dashboard/add-task-row";
import { useTasks } from "@/state/task-context";
import { useNow } from "@/domain/use-now";
import { createSeedDeadlines } from "@/data/dashboard";
import type { PillarId } from "@/lib/pillars";

function TodaysFocusCard() {
  const {
    todayTasks: tasks,
    completedCount,
    toggleTask,
    status,
    addTask,
    moveTaskInToday,
    removeFromToday,
  } = useTasks();
  const now = useNow();

  // Deadlines aren't shared context state (still seed-only, no CRUD exists —
  // see Phase 1/2 notes), so this calls the same pure factory UpcomingCard
  // does; same `now` in, same result out, no drift risk between the two.
  const deadlines = useMemo(() => (now ? createSeedDeadlines(now) : []), [now]);
  const deadlineById = useMemo(
    () => new Map(deadlines.map((d) => [d.id, d])),
    [deadlines]
  );

  const allDone = status === "ready" && tasks.length > 0 && completedCount === tasks.length;

  function handleAdd(title: string, pillar: PillarId) {
    if (!now) return;
    addTask({ title, pillar, scheduledFor: now.toISOString() });
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
                deadline={task.deadlineId ? deadlineById.get(task.deadlineId) : undefined}
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
        {status === "ready" ? <AddTaskRow onAdd={handleAdd} /> : null}
      </CardContent>
    </Card>
  );
}

export { TodaysFocusCard };
