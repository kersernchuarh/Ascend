import { describe, expect, it } from "vitest";
import {
  deliverableTaskProgress,
  deliverablesForSubject,
  effectiveDueAt,
  loggedMinutesForDeliverable,
  standaloneTasks,
  subjectRemainingCount,
  tasksForDeliverable,
  unassignedDeliverables,
  workSummary,
} from "./work";
import type { Deliverable, StudySession, Task } from "./types";

const NOW = new Date(2026, 8, 4, 12, 0, 0); // Fri 4 Sep 2026, 12:00 local

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    pillar: "academics",
    createdAt: "2026-09-01T09:00:00.000Z",
    ...overrides,
  };
}

function deliverable(overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    id: "d1",
    title: "Deliverable",
    pillar: "academics",
    dueAt: "2026-09-05T23:59:59.000Z",
    allDay: true,
    createdAt: "2026-09-01T09:00:00.000Z",
    ...overrides,
  };
}

function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    plannedStart: "2026-09-02T09:00:00.000Z",
    plannedEnd: "2026-09-02T09:45:00.000Z",
    actualStart: "2026-09-02T09:00:00.000Z",
    actualEnd: "2026-09-02T09:45:00.000Z",
    outcome: "completed",
    ...overrides,
  };
}

describe("effectiveDueAt", () => {
  it("prefers the task's own dueAt over its deliverable's", () => {
    const t = task({ dueAt: "2026-09-03T00:00:00.000Z", deliverableId: "d1" });
    const d = deliverable({ id: "d1", dueAt: "2026-09-10T00:00:00.000Z" });
    expect(effectiveDueAt(t, d)).toBe("2026-09-03T00:00:00.000Z");
  });

  it("falls back to the deliverable's dueAt when the task has none", () => {
    const t = task({ deliverableId: "d1" });
    const d = deliverable({ id: "d1", dueAt: "2026-09-10T00:00:00.000Z" });
    expect(effectiveDueAt(t, d)).toBe("2026-09-10T00:00:00.000Z");
  });

  it("is undefined for a standalone task with no date at all", () => {
    expect(effectiveDueAt(task())).toBeUndefined();
  });
});

describe("tasksForDeliverable / deliverableTaskProgress", () => {
  it("returns zero of zero for a deliverable with no tasks, not NaN", () => {
    expect(deliverableTaskProgress([], "d1")).toEqual({ done: 0, total: 0 });
  });

  it("counts only tasks linked to the given deliverable", () => {
    const tasks = [
      task({ id: "a", deliverableId: "d1", completedAt: "2026-09-02T00:00:00.000Z" }),
      task({ id: "b", deliverableId: "d1" }),
      task({ id: "c", deliverableId: "d2", completedAt: "2026-09-02T00:00:00.000Z" }),
      task({ id: "e" }),
    ];
    expect(tasksForDeliverable(tasks, "d1").map((t) => t.id)).toEqual(["a", "b"]);
    expect(deliverableTaskProgress(tasks, "d1")).toEqual({ done: 1, total: 2 });
  });
});

describe("loggedMinutesForDeliverable", () => {
  it("is zero with no sessions", () => {
    expect(loggedMinutesForDeliverable([], [], "d1")).toBe(0);
  });

  it("sums sessions logged against the deliverable's tasks", () => {
    const tasks = [task({ id: "a", deliverableId: "d1" }), task({ id: "b", deliverableId: "d2" })];
    const sessions = [
      session({ id: "s1", taskId: "a", actualStart: "2026-09-02T09:00:00.000Z", actualEnd: "2026-09-02T09:30:00.000Z" }),
      session({ id: "s2", taskId: "b", actualStart: "2026-09-02T09:00:00.000Z", actualEnd: "2026-09-02T09:30:00.000Z" }),
    ];
    expect(loggedMinutesForDeliverable(sessions, tasks, "d1")).toBe(30);
  });

  it("also counts a session logged directly against the deliverable, no task involved", () => {
    const sessions = [
      session({ id: "s1", deliverableId: "d1", actualStart: "2026-09-02T09:00:00.000Z", actualEnd: "2026-09-02T09:20:00.000Z" }),
    ];
    expect(loggedMinutesForDeliverable(sessions, [], "d1")).toBe(20);
  });

  it("does not double count a session that somehow matches both a task and the deliverable", () => {
    const tasks = [task({ id: "a", deliverableId: "d1" })];
    const sessions = [
      session({ id: "s1", taskId: "a", deliverableId: "d1", actualStart: "2026-09-02T09:00:00.000Z", actualEnd: "2026-09-02T09:15:00.000Z" }),
    ];
    expect(loggedMinutesForDeliverable(sessions, tasks, "d1")).toBe(15);
  });
});

describe("deliverablesForSubject / subjectRemainingCount / unassignedDeliverables", () => {
  it("groups deliverables by subject and counts only the outstanding ones", () => {
    const deliverables = [
      deliverable({ id: "d1", subjectId: "chem" }),
      deliverable({ id: "d2", subjectId: "chem", completedAt: "2026-09-02T00:00:00.000Z" }),
      deliverable({ id: "d3", subjectId: "history" }),
      deliverable({ id: "d4" }),
    ];
    expect(deliverablesForSubject(deliverables, "chem").map((d) => d.id)).toEqual(["d1", "d2"]);
    expect(subjectRemainingCount(deliverables, "chem")).toBe(1);
    expect(unassignedDeliverables(deliverables).map((d) => d.id)).toEqual(["d4"]);
  });
});

describe("standaloneTasks", () => {
  it("returns only tasks with no deliverable link", () => {
    const tasks = [task({ id: "a", deliverableId: "d1" }), task({ id: "b" })];
    expect(standaloneTasks(tasks).map((t) => t.id)).toEqual(["b"]);
  });
});

describe("workSummary", () => {
  it("is all zero with nothing outstanding", () => {
    expect(workSummary([], [], NOW)).toEqual({ overdue: 0, dueThisWeek: 0, remaining: 0 });
  });

  it("counts a completed deliverable/task toward nothing", () => {
    const deliverables = [
      deliverable({ id: "d1", dueAt: "2026-08-01T00:00:00.000Z", completedAt: "2026-08-02T00:00:00.000Z" }),
    ];
    const tasks = [task({ id: "t1", dueAt: "2026-08-01T00:00:00.000Z", completedAt: "2026-08-02T00:00:00.000Z" })];
    expect(workSummary(tasks, deliverables, NOW)).toEqual({ overdue: 0, dueThisWeek: 0, remaining: 0 });
  });

  it("classifies overdue vs. due-this-week vs. remaining-with-no-date", () => {
    const deliverables = [
      deliverable({ id: "d1", dueAt: "2026-09-01T00:00:00.000Z" }), // overdue
      deliverable({ id: "d2", dueAt: "2026-09-06T00:00:00.000Z" }), // 2 days away
    ];
    const tasks = [
      task({ id: "t1" }), // no date at all — remaining only
      task({ id: "t2", dueAt: "2026-09-20T00:00:00.000Z" }), // 2+ weeks out — remaining only
    ];
    expect(workSummary(tasks, deliverables, NOW)).toEqual({ overdue: 1, dueThisWeek: 1, remaining: 4 });
  });

  it("does not double-count a deliverable's due date via a task that merely inherits it", () => {
    const deliverables = [deliverable({ id: "d1", dueAt: "2026-09-05T00:00:00.000Z" })];
    const tasks = [task({ id: "t1", deliverableId: "d1" })]; // no dueAt of its own
    expect(workSummary(tasks, deliverables, NOW)).toEqual({ overdue: 0, dueThisWeek: 1, remaining: 2 });
  });

  it("prefers a task's own due date over its deliverable's when both are set", () => {
    const deliverables = [deliverable({ id: "d1", dueAt: "2026-09-20T00:00:00.000Z" })];
    const tasks = [task({ id: "t1", deliverableId: "d1", dueAt: "2026-09-01T00:00:00.000Z" })]; // overdue
    expect(workSummary(tasks, deliverables, NOW)).toEqual({ overdue: 1, dueThisWeek: 0, remaining: 2 });
  });
});
