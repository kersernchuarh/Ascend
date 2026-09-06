import { daysUntilDue, isOverdue } from "./time";
import type { Deliverable, StudySession, Task } from "./types";

/**
 * Pure, deterministic derivations over `Subject`/`Deliverable`/`Task`
 * relationships (PRODUCT_BLUEPRINT.md §6.3, §10 — Phase 4). Nothing here is
 * stored: subject/deliverable rollups, effective due dates and logged
 * effort are all computed fresh from the entities a caller already has, the
 * same rule `domain/metrics.ts` follows for session/habit statistics.
 */

/** A task's own `dueAt` if set, else its linked deliverable's `dueAt`, else
 *  undefined. A task's own date always wins — it is an explicit override,
 *  not a duplicate of the deliverable's date (see `Task.dueAt`'s docs). */
export function effectiveDueAt(task: Task, deliverable?: Deliverable): string | undefined {
  return task.dueAt ?? deliverable?.dueAt;
}

/** Every task linked to `deliverableId`, in no particular order — callers
 *  sort as their display needs (e.g. incomplete-first). */
export function tasksForDeliverable(tasks: Task[], deliverableId: string): Task[] {
  return tasks.filter((task) => task.deliverableId === deliverableId);
}

/** "3 of 5 tasks done" for a deliverable — a real count, never a percentage:
 *  a deliverable with zero tasks has no meaningful ratio to show. */
export function deliverableTaskProgress(
  tasks: Task[],
  deliverableId: string
): { done: number; total: number } {
  const linked = tasksForDeliverable(tasks, deliverableId);
  return { done: linked.filter((task) => task.completedAt != null).length, total: linked.length };
}

/** Real minutes actually logged toward `deliverableId` — every session
 *  whose `taskId` belongs to one of this deliverable's tasks, plus any
 *  session logged directly against the deliverable via `deliverableId`.
 *  Comparable against `Deliverable.estimateMinutes`, but never presented as
 *  a percentage here — that's a display-layer decision, not a domain one. */
export function loggedMinutesForDeliverable(
  sessions: StudySession[],
  tasks: Task[],
  deliverableId: string
): number {
  const taskIds = new Set(tasksForDeliverable(tasks, deliverableId).map((task) => task.id));
  const relevant = sessions.filter(
    (session) =>
      session.deliverableId === deliverableId ||
      (session.taskId != null && taskIds.has(session.taskId))
  );
  return relevant.reduce((sum, session) => {
    const minutes =
      (new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()) / 60_000;
    return sum + Math.round(minutes);
  }, 0);
}

/** Deliverables grouped under `subjectId`, unsorted — callers sort by due
 *  date for display (`domain/time.sortByIsoDate`). */
export function deliverablesForSubject(
  deliverables: Deliverable[],
  subjectId: string
): Deliverable[] {
  return deliverables.filter((deliverable) => deliverable.subjectId === subjectId);
}

/** How many of a subject's deliverables are still outstanding — real count,
 *  used for a subject group's "2 remaining" summary, never a percentage. */
export function subjectRemainingCount(deliverables: Deliverable[], subjectId: string): number {
  return deliverablesForSubject(deliverables, subjectId).filter(
    (deliverable) => deliverable.completedAt == null
  ).length;
}

/** Deliverables with no `subjectId` at all — Work's "Unassigned" group. */
export function unassignedDeliverables(deliverables: Deliverable[]): Deliverable[] {
  return deliverables.filter((deliverable) => deliverable.subjectId == null);
}

/** Tasks with no `deliverableId` at all — Work's standalone task list. */
export function standaloneTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.deliverableId == null);
}

export type WorkSummary = { overdue: number; dueThisWeek: number; remaining: number };

/**
 * The three real, derived counts Work's summary strip shows. "Overdue" and
 * "due this week" count every outstanding deliverable's `dueAt`, plus only
 * a task's *own* `dueAt` — deliberately not `effectiveDueAt`'s inherited
 * fallback, which would double-count the same real deadline once for the
 * deliverable and again for each task inheriting it. A task with no `dueAt`
 * of its own (whether or not it has a deliverable) contributes to neither
 * count. "Remaining" is every outstanding item regardless of whether it has
 * a date at all — a real backlog count, not a percentage.
 */
export function workSummary(tasks: Task[], deliverables: Deliverable[], now: Date): WorkSummary {
  const outstandingDeliverables = deliverables.filter((d) => d.completedAt == null);
  const outstandingTasks = tasks.filter((t) => t.completedAt == null);

  let overdue = 0;
  let dueThisWeek = 0;
  const tally = (dueAt: string | undefined) => {
    if (!dueAt) return;
    if (isOverdue(dueAt, now)) {
      overdue += 1;
      return;
    }
    const days = daysUntilDue(dueAt, now);
    if (days >= 0 && days <= 6) dueThisWeek += 1;
  };

  for (const deliverable of outstandingDeliverables) tally(deliverable.dueAt);
  for (const task of outstandingTasks) tally(task.dueAt);

  return {
    overdue,
    dueThisWeek,
    remaining: outstandingDeliverables.length + outstandingTasks.length,
  };
}
