import { describe, expect, it } from "vitest";
import {
  estimateAccuracy,
  weekInReview,
  weeklyFocusHabitJuxtaposition,
  workloadByPillar,
} from "./progress";
import type { Deliverable, HabitLog, StudySession, Task } from "./types";

const NOW = new Date(2026, 8, 4, 18, 0, 0); // Fri 4 Sep 2026 (week of Mon 31 Aug)

function iso(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return new Date(year, month, day, hours, minutes).toISOString();
}

function task(overrides: Partial<Task> = {}): Task {
  return { id: "t1", title: "Task", pillar: "academics", createdAt: iso(2026, 8, 1, 9, 0), ...overrides };
}

function deliverable(overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    id: "d1",
    title: "Deliverable",
    pillar: "academics",
    dueAt: iso(2026, 8, 10, 23, 59),
    allDay: true,
    createdAt: iso(2026, 8, 1, 9, 0),
    ...overrides,
  };
}

function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    plannedStart: iso(2026, 8, 4, 9, 0),
    plannedEnd: iso(2026, 8, 4, 9, 45),
    actualStart: iso(2026, 8, 4, 9, 0),
    actualEnd: iso(2026, 8, 4, 9, 45),
    outcome: "completed",
    ...overrides,
  };
}

describe("weekInReview", () => {
  it("is all-zero with previous null when there is no data at all", () => {
    const result = weekInReview([], [], NOW);
    expect(result).toEqual({ sessionCount: 0, focusedMinutes: 0, tasksCompleted: 0, previous: null });
  });

  it("counts only this week's sessions and completed tasks", () => {
    const sessions = [
      session({ id: "this-week", actualStart: iso(2026, 8, 2, 9, 0), actualEnd: iso(2026, 8, 2, 9, 30) }),
      session({ id: "next-week", actualStart: iso(2026, 8, 8, 9, 0), actualEnd: iso(2026, 8, 8, 9, 30) }),
    ];
    const tasks = [
      task({ id: "a", completedAt: iso(2026, 8, 3, 10, 0) }),
      task({ id: "b", completedAt: iso(2026, 7, 30, 10, 0) }), // previous week
      task({ id: "c" }), // not completed
    ];
    const result = weekInReview(sessions, tasks, NOW);
    expect(result.sessionCount).toBe(1);
    expect(result.focusedMinutes).toBe(30);
    expect(result.tasksCompleted).toBe(1);
  });

  it("reports previous week's real figures once it has any data", () => {
    const sessions = [
      session({ id: "prev", actualStart: iso(2026, 7, 25, 9, 0), actualEnd: iso(2026, 7, 25, 9, 20) }),
    ];
    const result = weekInReview(sessions, [], NOW);
    expect(result.previous).toEqual({ sessionCount: 1, focusedMinutes: 20, tasksCompleted: 0 });
  });

  it("previous stays null when the previous week has zero sessions and zero completions, even with unrelated data elsewhere", () => {
    const sessions = [session({ actualStart: iso(2026, 8, 2, 9, 0), actualEnd: iso(2026, 8, 2, 9, 30) })];
    const tasks = [task({ completedAt: iso(2026, 8, 2, 10, 0) })];
    const result = weekInReview(sessions, tasks, NOW);
    expect(result.previous).toBeNull();
  });
});

describe("workloadByPillar", () => {
  it("is empty with nothing outstanding", () => {
    expect(workloadByPillar([], [])).toEqual([]);
  });

  it("sums remaining estimated minutes per pillar, sorted heaviest first", () => {
    const tasks = [
      task({ id: "a", pillar: "academics", estimateMinutes: 30 }),
      task({ id: "b", pillar: "health", estimateMinutes: 20 }),
    ];
    const deliverables = [deliverable({ id: "d1", pillar: "academics", estimateMinutes: 90 })];
    expect(workloadByPillar(tasks, deliverables)).toEqual([
      { pillar: "academics", remainingMinutes: 120 },
      { pillar: "health", remainingMinutes: 20 },
    ]);
  });

  it("excludes completed items and items with no estimate", () => {
    const tasks = [
      task({ id: "a", pillar: "academics", estimateMinutes: 30, completedAt: iso(2026, 8, 2) }),
      task({ id: "b", pillar: "academics" }), // no estimate
    ];
    expect(workloadByPillar(tasks, [])).toEqual([]);
  });
});

describe("estimateAccuracy", () => {
  it("is null with no qualifying deliverable", () => {
    expect(estimateAccuracy([], [], [])).toBeNull();
  });

  it("is null for a completed, estimated deliverable with zero logged minutes", () => {
    const d = deliverable({ id: "d1", estimateMinutes: 60, completedAt: iso(2026, 8, 3) });
    expect(estimateAccuracy([d], [], [])).toBeNull();
  });

  it("computes ratio across qualifying deliverables only", () => {
    const d1 = deliverable({ id: "d1", estimateMinutes: 60, completedAt: iso(2026, 8, 3) });
    const d2 = deliverable({ id: "d2", estimateMinutes: 100 }); // not completed -> excluded
    const tasks = [task({ id: "t1", deliverableId: "d1" })];
    const sessions = [
      session({ taskId: "t1", actualStart: iso(2026, 8, 2, 9, 0), actualEnd: iso(2026, 8, 2, 10, 30) }), // 90 min
    ];
    const result = estimateAccuracy([d1, d2], tasks, sessions);
    expect(result).toEqual({ sampleSize: 1, estimatedMinutes: 60, actualMinutes: 90, ratio: 1.5 });
  });
});

describe("weeklyFocusHabitJuxtaposition", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  it("is null with neither sessions nor habit logs", () => {
    expect(weeklyFocusHabitJuxtaposition([], [], NOW)).toBeNull();
  });

  it("is null with sessions but no habit logs this week", () => {
    const sessions = [session({ actualStart: iso(2026, 8, 2, 9, 0), actualEnd: iso(2026, 8, 2, 9, 30) })];
    expect(weeklyFocusHabitJuxtaposition(sessions, [], NOW)).toBeNull();
  });

  it("is null with habit logs but no sessions this week", () => {
    const logs = [log("h1", "2026-09-02")];
    expect(weeklyFocusHabitJuxtaposition([], logs, NOW)).toBeNull();
  });

  it("returns both real figures once both exist this week", () => {
    const sessions = [
      session({ actualStart: iso(2026, 8, 2, 9, 0), actualEnd: iso(2026, 8, 2, 9, 30) }),
      session({ id: "s2", actualStart: iso(2026, 8, 3, 9, 0), actualEnd: iso(2026, 8, 3, 9, 20) }),
    ];
    const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-02"), log("h2", "2026-09-02")];
    expect(weeklyFocusHabitJuxtaposition(sessions, logs, NOW)).toEqual({
      focusedMinutes: 50,
      habitDaysLogged: 2, // Sep 1 and Sep 2 — distinct days, not distinct logs
    });
  });
});
