"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, PartyPopper, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkSummaryStrip } from "@/components/work/work-summary-strip";
import { CreateSubjectForm } from "@/components/work/create-subject-form";
import { DeliverableForm } from "@/components/work/deliverable-form";
import { TaskForm } from "@/components/work/task-form";
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
 *
 * Search/filter (§28 gap #5): a single text query matched against subject
 * names, deliverable titles, and standalone task titles, plus a "hide
 * completed" toggle — real filtering over the same real data, not a second
 * index. Matching a subject's name shows every one of its deliverables
 * (searching nested task titles isn't in scope; §10's own "smallest
 * coherent implementation" call for this phase).
 */
export default function WorkPage() {
  const { subjects, addSubject, renameSubject, deleteSubject } = useSubjects();
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

  const [query, setQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

  const ready = deliverableStatus === "ready" && taskStatus === "ready" && now != null;

  const summary = useMemo(
    () => (now ? workSummary(tasks, deliverables, now) : { overdue: 0, dueThisWeek: 0, remaining: 0 }),
    [tasks, deliverables, now]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const matches = (title: string) => title.toLowerCase().includes(normalizedQuery);
  const passesCompleted = (completedAt: string | undefined) => !hideCompleted || completedAt == null;

  // Plain filters, not `useMemo` — every input here is a title-substring
  // check over arrays that are already small (a real term's Work data is
  // dozens of rows, not thousands), so memoizing would add dependency-array
  // fragility (these closures capture `normalizedQuery`/`hideCompleted`
  // fresh every render) for no measurable benefit.
  const visibleSubjects = subjects.filter((subject) => {
    if (!hasQuery) return true;
    if (matches(subject.name)) return true;
    return deliverablesForSubject(deliverables, subject.id).some((d) => matches(d.title));
  });

  const deliverablesFor = (subjectId: string, subjectName: string) => {
    const subjectMatchedByName = hasQuery && matches(subjectName);
    return deliverablesForSubject(deliverables, subjectId).filter((d) => {
      if (!passesCompleted(d.completedAt)) return false;
      if (!hasQuery || subjectMatchedByName) return true;
      return matches(d.title);
    });
  };

  const unassigned = sortByIsoDate(unassignedDeliverables(deliverables), (d) => d.dueAt).filter(
    (d) => passesCompleted(d.completedAt) && (!hasQuery || matches(d.title))
  );
  const standalone = standaloneTasks(tasks).filter(
    (t) => passesCompleted(t.completedAt) && (!hasQuery || matches(t.title))
  );

  const hasAnything = subjects.length > 0 || deliverables.length > 0 || tasks.length > 0;
  const allDone = ready && hasAnything && summary.remaining === 0;
  // Scoped to just this card's own content (subjects + unassigned) — a
  // search that only matches a standalone task should still explain why
  // the Subjects card looks empty, rather than leaving a blank gap.
  const noSubjectsMatch =
    hasQuery &&
    visibleSubjects.every((s) => deliverablesFor(s.id, s.name).length === 0) &&
    unassigned.length === 0;

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

      {ready && hasAnything ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search deliverables and tasks…"
              aria-label="Search Work"
              className="pl-8 pr-8"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-caption text-muted-foreground">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(event) => setHideCompleted(event.target.checked)}
              className="size-3.5 rounded-[4px] border border-input"
            />
            Hide completed
          </label>
        </div>
      ) : null}

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
          <DeliverableForm onSubmit={(input) => addDeliverable(input)} />

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
          ) : noSubjectsMatch ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search className="size-6 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-body text-muted-foreground">Nothing matches &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {visibleSubjects.map((subject) => (
                <SubjectSection
                  key={subject.id}
                  subject={subject}
                  deliverables={deliverablesFor(subject.id, subject.name)}
                  tasks={tasks}
                  sessions={sessions}
                  now={now ?? new Date()}
                  onRenameSubject={(name) => renameSubject(subject.id, name)}
                  onToggleDeliverable={toggleDeliverable}
                  onUpdateDeliverable={updateDeliverable}
                  onDeleteDeliverable={handleDeleteDeliverable}
                  onDeleteSubject={() => handleDeleteSubject(subject.id)}
                  onToggleTask={toggleTask}
                  onUpdateTask={updateTask}
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
                        onUpdate={(input) => updateDeliverable(deliverable.id, input)}
                        onDelete={() => handleDeleteDeliverable(deliverable.id)}
                        onToggleTask={toggleTask}
                        onUpdateTask={updateTask}
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
            <TaskForm onSubmit={(input) => addTask(input)} />
            {!ready ? (
              <div className="flex flex-col gap-3" aria-hidden="true">
                <Skeleton className="h-14 w-full rounded-[10px]" />
                <Skeleton className="h-14 w-full rounded-[10px]" />
              </div>
            ) : standalone.length === 0 ? (
              <p className="py-6 text-center text-body text-muted-foreground">
                {hasQuery || hideCompleted ? "No matching standalone tasks" : "No standalone tasks"}
              </p>
            ) : (
              <ul>
                {standalone.map((task) => (
                  <WorkTaskRow
                    key={task.id}
                    task={task}
                    now={now ?? new Date()}
                    onToggle={() => toggleTask(task.id)}
                    onUpdate={(input) => updateTask(task.id, input)}
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
