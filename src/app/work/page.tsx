"use client";

import { useMemo } from "react";
import { ClipboardCheck, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkSummaryStrip } from "@/components/work/work-summary-strip";
import { CreateSubjectForm } from "@/components/work/create-subject-form";
import { CreateDeliverableForm } from "@/components/work/create-deliverable-form";
import { CreateTaskForm } from "@/components/work/create-task-form";
import { SubjectSection } from "@/components/work/subject-section";
import { DeliverableRow } from "@/components/work/deliverable-row";
import { WorkTaskRow } from "@/components/work/task-row";
import { useSubjects } from "@/state/subject-context";
import { useDeliverables } from "@/state/deliverable-context";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useNow } from "@/domain/use-now";
import { sortByIsoDate } from "@/domain/time";
import {
  deliverablesForSubject,
  standaloneTasks,
  unassignedDeliverables,
  workSummary,
} from "@/domain/work";

/**
 * Work: the durable home of everything outstanding, grouped the way a
 * student actually thinks about it — by subject and deliverable, not one
 * flat list (PRODUCT_BLUEPRINT.md §7.2, §10). Reads and writes the exact
 * same `TaskProvider`/`DeliverableProvider`/`SubjectProvider` state Home
 * reads — there is no second representation to fall out of sync (Step 6).
 */
export default function WorkPage() {
  const { subjects, addSubject, deleteSubject } = useSubjects();
  const {
    deliverables,
    status: deliverableStatus,
    addDeliverable,
    updateDeliverable,
    toggleDeliverable,
    deleteDeliverable,
  } = useDeliverables();
  const { tasks, status: taskStatus, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const { sessions } = useSessions();
  const now = useNow();

  const ready = deliverableStatus === "ready" && taskStatus === "ready" && now != null;

  const summary = useMemo(
    () => (now ? workSummary(tasks, deliverables, now) : { overdue: 0, dueThisWeek: 0, remaining: 0 }),
    [tasks, deliverables, now]
  );
  const unassigned = useMemo(
    () => sortByIsoDate(unassignedDeliverables(deliverables), (d) => d.dueAt),
    [deliverables]
  );
  const standalone = useMemo(() => standaloneTasks(tasks), [tasks]);

  const hasAnything = subjects.length > 0 || deliverables.length > 0 || tasks.length > 0;
  const allDone = ready && hasAnything && summary.remaining === 0;

  // Deleting a Subject/Deliverable never cascades — see the matching notes
  // on `SubjectProvider.deleteSubject` and `DeliverableProvider.deleteDeliverable`.
  // Unlinking the children first (here, at the one place both contexts are
  // in scope) is what keeps that promise without either provider needing to
  // know the other exists.
  function handleDeleteSubject(id: string) {
    deliverablesForSubject(deliverables, id).forEach((deliverable) =>
      updateDeliverable(deliverable.id, { subjectId: undefined })
    );
    deleteSubject(id);
  }

  function handleDeleteDeliverable(id: string) {
    tasks
      .filter((task) => task.deliverableId === id)
      .forEach((task) => updateTask(task.id, { deliverableId: undefined }));
    deleteDeliverable(id);
  }

  return (
    <div className="flex flex-col gap-6">
      {ready ? (
        <WorkSummaryStrip summary={summary} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            level={2}
            title="Subjects"
            description="Deliverables, grouped the way you actually think about your work"
          />
          <div className="flex flex-wrap items-center gap-3">
            <CreateSubjectForm onCreate={(name) => addSubject(name)} />
          </div>
          <CreateDeliverableForm onCreate={(input) => addDeliverable(input)} />

          {!ready ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-16 w-full rounded-[10px]" />
              <Skeleton className="h-16 w-full rounded-[10px]" />
            </div>
          ) : !hasAnything ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <ClipboardCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-body text-muted-foreground">
                Nothing here yet — add a subject or a deliverable to get started
              </p>
            </div>
          ) : allDone ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <PartyPopper className="size-6 text-primary" strokeWidth={1.5} />
              <p className="text-body text-foreground">Everything&apos;s submitted and done</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {subjects.map((subject) => (
                <SubjectSection
                  key={subject.id}
                  subject={subject}
                  deliverables={deliverablesForSubject(deliverables, subject.id)}
                  tasks={tasks}
                  sessions={sessions}
                  now={now ?? new Date()}
                  onToggleDeliverable={toggleDeliverable}
                  onDeleteDeliverable={handleDeleteDeliverable}
                  onDeleteSubject={() => handleDeleteSubject(subject.id)}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onCreateTask={(input) => addTask(input)}
                />
              ))}

              {unassigned.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-h3 text-foreground">Unassigned</h3>
                  <ul>
                    {unassigned.map((deliverable) => (
                      <DeliverableRow
                        key={deliverable.id}
                        deliverable={deliverable}
                        tasks={tasks}
                        sessions={sessions}
                        now={now ?? new Date()}
                        onToggle={() => toggleDeliverable(deliverable.id)}
                        onDelete={() => handleDeleteDeliverable(deliverable.id)}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        onCreateTask={(input) => addTask(input)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {!ready || hasAnything ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <SectionHeader title="Other tasks" description="Not tied to any deliverable" />
            <CreateTaskForm onCreate={(input) => addTask(input)} />
            {!ready ? (
              <div className="flex flex-col gap-3" aria-hidden="true">
                <Skeleton className="h-14 w-full rounded-[10px]" />
                <Skeleton className="h-14 w-full rounded-[10px]" />
              </div>
            ) : standalone.length === 0 ? (
              <p className="py-6 text-center text-body text-muted-foreground">No standalone tasks</p>
            ) : (
              <ul>
                {standalone.map((task) => (
                  <WorkTaskRow
                    key={task.id}
                    task={task}
                    now={now ?? new Date()}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
