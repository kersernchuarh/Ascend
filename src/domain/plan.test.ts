import { describe, expect, it } from "vitest";
import {
  FREE_TIME_HORIZON_DAYS,
  atRiskDeliverables,
  busyIntervalsForDay,
  calendarEventOccurrenceOn,
  dayHasConflict,
  freeBlocksForDay,
  freeIntervals,
  freeMinutesForDay,
  freeMinutesUntil,
  mergeIntervals,
  remainingEffortMinutes,
  taskWorkBlock,
  wakingWindow,
  weekDays,
  workloadRisk,
  type FreeTimePreferences,
} from "./plan";
import type { CalendarEvent, Deliverable, StudySession, Task } from "./types";

// Fri 4 Sep 2026 is used throughout the rest of the domain test suite as the
// reference "now" — reused here so day-of-week reasoning stays consistent.
const NOW = new Date(2026, 8, 4, 12, 0, 0); // Fri, 12:00 local, getDay() === 5
const TODAY = new Date(2026, 8, 4);
const TOMORROW = new Date(2026, 8, 5); // Sat, getDay() === 6

const PREFS: FreeTimePreferences = { wakingStartHour: 7, wakingEndHour: 23 };

function iso(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return new Date(year, month, day, hours, minutes).toISOString();
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    pillar: "academics",
    createdAt: iso(2026, 8, 1, 9, 0),
    ...overrides,
  };
}

function deliverable(overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    id: "d1",
    title: "Deliverable",
    pillar: "academics",
    dueAt: iso(2026, 8, 5, 23, 59),
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

// Defaults to Friday 8:00-9:00 — TODAY/NOW's day of week.
function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "c1",
    title: "Class",
    kind: "class",
    dayOfWeek: 5,
    startMinutes: 8 * 60,
    durationMinutes: 60,
    createdAt: iso(2026, 8, 1, 9, 0),
    ...overrides,
  };
}

describe("calendarEventOccurrenceOn", () => {
  it("is undefined when the day doesn't match the event's day of week", () => {
    expect(calendarEventOccurrenceOn(event({ dayOfWeek: 1 }), TODAY)).toBeUndefined();
  });

  it("computes the real start/end for a matching day", () => {
    const occurrence = calendarEventOccurrenceOn(event({ startMinutes: 8 * 60, durationMinutes: 90 }), TODAY);
    expect(occurrence).toEqual({ startAt: iso(2026, 8, 4, 8, 0), endAt: iso(2026, 8, 4, 9, 30) });
  });

  it("recurs identically on the same weekday in a different week", () => {
    const nextFriday = new Date(2026, 8, 11); // also getDay() === 5
    const occurrence = calendarEventOccurrenceOn(event(), nextFriday);
    expect(occurrence).toEqual({ startAt: iso(2026, 8, 11, 8, 0), endAt: iso(2026, 8, 11, 9, 0) });
  });
});

describe("wakingWindow", () => {
  it("spans the configured waking hours on the given day", () => {
    const w = wakingWindow(TODAY, PREFS);
    expect(new Date(w.startAt).getHours()).toBe(7);
    expect(new Date(w.endAt).getHours()).toBe(23);
  });

  it("respects a different configured window", () => {
    const w = wakingWindow(TODAY, { wakingStartHour: 6, wakingEndHour: 22 });
    expect(new Date(w.startAt).getHours()).toBe(6);
    expect(new Date(w.endAt).getHours()).toBe(22);
  });
});

describe("mergeIntervals", () => {
  it("merges overlapping intervals into one", () => {
    const merged = mergeIntervals([
      { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 10, 0) },
      { startAt: iso(2026, 8, 4, 9, 30), endAt: iso(2026, 8, 4, 11, 0) },
    ]);
    expect(merged).toEqual([{ startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 11, 0) }]);
  });

  it("merges touching intervals (one ends exactly when the other starts)", () => {
    const merged = mergeIntervals([
      { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 10, 0) },
      { startAt: iso(2026, 8, 4, 10, 0), endAt: iso(2026, 8, 4, 11, 0) },
    ]);
    expect(merged).toEqual([{ startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 11, 0) }]);
  });

  it("leaves non-overlapping intervals separate", () => {
    const merged = mergeIntervals([
      { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 10, 0) },
      { startAt: iso(2026, 8, 4, 11, 0), endAt: iso(2026, 8, 4, 12, 0) },
    ]);
    expect(merged).toHaveLength(2);
  });

  it("returns an empty array for no intervals", () => {
    expect(mergeIntervals([])).toEqual([]);
  });
});

describe("freeIntervals", () => {
  it("is the whole window with no busy intervals", () => {
    const window = { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 12, 0) };
    expect(freeIntervals(window, [])).toEqual([window]);
  });

  it("splits the window around a busy interval in the middle", () => {
    const window = { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 12, 0) };
    const busy = [{ startAt: iso(2026, 8, 4, 10, 0), endAt: iso(2026, 8, 4, 11, 0) }];
    expect(freeIntervals(window, busy)).toEqual([
      { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 10, 0) },
      { startAt: iso(2026, 8, 4, 11, 0), endAt: iso(2026, 8, 4, 12, 0) },
    ]);
  });

  it("is empty when a busy interval covers the entire window", () => {
    const window = { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 12, 0) };
    const busy = [{ startAt: iso(2026, 8, 4, 8, 0), endAt: iso(2026, 8, 4, 13, 0) }];
    expect(freeIntervals(window, busy)).toEqual([]);
  });

  it("clips a busy interval that only partially overlaps the window", () => {
    const window = { startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 12, 0) };
    const busy = [{ startAt: iso(2026, 8, 4, 11, 0), endAt: iso(2026, 8, 4, 14, 0) }];
    expect(freeIntervals(window, busy)).toEqual([{ startAt: iso(2026, 8, 4, 9, 0), endAt: iso(2026, 8, 4, 11, 0) }]);
  });
});

describe("taskWorkBlock", () => {
  it("is undefined with no scheduledFor", () => {
    expect(taskWorkBlock(task({ estimateMinutes: 30 }))).toBeUndefined();
  });

  it("is undefined with no estimateMinutes — a due date/time isn't a duration", () => {
    expect(taskWorkBlock(task({ scheduledFor: iso(2026, 8, 4, 9, 0) }))).toBeUndefined();
  });

  it("is undefined once the task is completed", () => {
    const t = task({
      scheduledFor: iso(2026, 8, 4, 9, 0),
      estimateMinutes: 30,
      completedAt: iso(2026, 8, 4, 9, 30),
    });
    expect(taskWorkBlock(t)).toBeUndefined();
  });

  it("spans scheduledFor to scheduledFor + estimateMinutes", () => {
    const t = task({ scheduledFor: iso(2026, 8, 4, 9, 0), estimateMinutes: 30 });
    expect(taskWorkBlock(t)).toEqual({
      startAt: iso(2026, 8, 4, 9, 0),
      endAt: iso(2026, 8, 4, 9, 30),
    });
  });
});

describe("busyIntervalsForDay / dayHasConflict", () => {
  it("combines fixed events, logged sessions, and scheduled-incomplete task blocks", () => {
    const events = [event()];
    const sessions = [session()];
    const tasks = [task({ scheduledFor: iso(2026, 8, 4, 14, 0), estimateMinutes: 30 })];
    expect(busyIntervalsForDay(TODAY, events, tasks, sessions, PREFS)).toHaveLength(3);
  });

  it("excludes a completed task's block", () => {
    const tasks = [
      task({ scheduledFor: iso(2026, 8, 4, 14, 0), estimateMinutes: 30, completedAt: iso(2026, 8, 4, 14, 30) }),
    ];
    expect(busyIntervalsForDay(TODAY, [], tasks, [], PREFS)).toEqual([]);
  });

  it("includes quiet hours as a busy interval when set", () => {
    const prefsWithQuiet: FreeTimePreferences = { ...PREFS, quietHoursStart: 18, quietHoursEnd: 19 };
    expect(busyIntervalsForDay(TODAY, [], [], [], prefsWithQuiet)).toEqual([
      { startAt: iso(2026, 8, 4, 18, 0), endAt: iso(2026, 8, 4, 19, 0) },
    ]);
  });

  it("omits quiet hours when unset", () => {
    expect(busyIntervalsForDay(TODAY, [], [], [], PREFS)).toEqual([]);
  });

  it("ignores a reversed/empty quiet-hours range rather than guessing", () => {
    const prefsReversed: FreeTimePreferences = { ...PREFS, quietHoursStart: 19, quietHoursEnd: 18 };
    expect(busyIntervalsForDay(TODAY, [], [], [], prefsReversed)).toEqual([]);
  });

  it("dayHasConflict is false with no overlaps", () => {
    const events = [event()];
    const tasks = [task({ scheduledFor: iso(2026, 8, 4, 14, 0), estimateMinutes: 30 })];
    expect(dayHasConflict(TODAY, events, tasks)).toBe(false);
  });

  it("dayHasConflict is true when a scheduled task overlaps a fixed event", () => {
    const events = [event({ startMinutes: 9 * 60, durationMinutes: 60 })];
    const tasks = [task({ scheduledFor: iso(2026, 8, 4, 9, 30), estimateMinutes: 30 })];
    expect(dayHasConflict(TODAY, events, tasks)).toBe(true);
  });

  it("dayHasConflict takes no sessions parameter at all — logged history can never register as a planning conflict", () => {
    expect(dayHasConflict.length).toBe(3);
  });
});

describe("freeMinutesForDay / freeBlocksForDay", () => {
  it("is the full 16-hour waking window for a day with nothing on it", () => {
    expect(freeMinutesForDay(TOMORROW, [], [], [], NOW, PREFS)).toBe(16 * 60);
  });

  it("subtracts a fixed event's duration", () => {
    const events = [event({ dayOfWeek: 6, startMinutes: 9 * 60, durationMinutes: 60 })]; // Sat, matches TOMORROW
    expect(freeMinutesForDay(TOMORROW, events, [], [], NOW, PREFS)).toBe(16 * 60 - 60);
  });

  it("subtracts quiet hours too", () => {
    const prefsWithQuiet: FreeTimePreferences = { ...PREFS, quietHoursStart: 18, quietHoursEnd: 19 };
    expect(freeMinutesForDay(TOMORROW, [], [], [], NOW, prefsWithQuiet)).toBe(16 * 60 - 60);
  });

  it("for today, only counts the window remaining from now — not the whole day", () => {
    // NOW is 12:00; waking window is 7:00-23:00 (16h). Remaining = 11h = 660 min.
    expect(freeMinutesForDay(TODAY, [], [], [], NOW, PREFS)).toBe(11 * 60);
  });

  it("respects a narrower configured waking window", () => {
    const narrowPrefs: FreeTimePreferences = { wakingStartHour: 8, wakingEndHour: 20 };
    expect(freeMinutesForDay(TOMORROW, [], [], [], NOW, narrowPrefs)).toBe(12 * 60);
  });

  it("freeBlocksForDay returns the actual open gaps", () => {
    const events = [event({ dayOfWeek: 6, startMinutes: 9 * 60, durationMinutes: 60 })];
    const blocks = freeBlocksForDay(TOMORROW, events, [], [], NOW, PREFS);
    expect(blocks).toEqual([
      { startAt: iso(2026, 8, 5, 7, 0), endAt: iso(2026, 8, 5, 9, 0) },
      { startAt: iso(2026, 8, 5, 10, 0), endAt: iso(2026, 8, 5, 23, 0) },
    ]);
  });
});

describe("remainingEffortMinutes", () => {
  it("is undefined with no estimate at all", () => {
    expect(remainingEffortMinutes(deliverable(), [], [])).toBeUndefined();
  });

  it("is the full estimate with nothing logged", () => {
    expect(remainingEffortMinutes(deliverable({ estimateMinutes: 90 }), [], [])).toBe(90);
  });

  it("subtracts real logged minutes", () => {
    const d = deliverable({ id: "d1", estimateMinutes: 90 });
    const tasks = [task({ id: "t1", deliverableId: "d1" })];
    const sessions = [
      session({ taskId: "t1", actualStart: iso(2026, 8, 4, 9, 0), actualEnd: iso(2026, 8, 4, 9, 30) }),
    ];
    expect(remainingEffortMinutes(d, tasks, sessions)).toBe(60);
  });

  it("floors at 0 rather than going negative once logged time exceeds the estimate", () => {
    const d = deliverable({ id: "d1", estimateMinutes: 30 });
    const tasks = [task({ id: "t1", deliverableId: "d1" })];
    const sessions = [
      session({ taskId: "t1", actualStart: iso(2026, 8, 4, 9, 0), actualEnd: iso(2026, 8, 4, 10, 0) }),
    ];
    expect(remainingEffortMinutes(d, tasks, sessions)).toBe(0);
  });
});

describe("freeMinutesUntil", () => {
  it("clips today to the deadline instant, not the rest of the waking window", () => {
    // NOW is 12:00; deadline is 22:00 the same day -> 10h, not the full 11h remaining today.
    const untilToday = iso(2026, 8, 4, 22, 0);
    expect(freeMinutesUntil(untilToday, [], [], [], NOW, PREFS)).toBe(10 * 60);
  });

  it("sums across multiple days, clipping only the final day to the deadline", () => {
    // Day 1 (today): now(12:00) -> waking end(23:00) = 11h.
    // Day 2 (deadline day): waking start(7:00) -> deadline(22:00) = 15h.
    const untilTomorrow = iso(2026, 8, 5, 22, 0);
    expect(freeMinutesUntil(untilTomorrow, [], [], [], NOW, PREFS)).toBe(11 * 60 + 15 * 60);
  });

  it("respects FREE_TIME_HORIZON_DAYS as a real, named cap", () => {
    expect(FREE_TIME_HORIZON_DAYS).toBeGreaterThan(0);
  });
});

describe("workloadRisk", () => {
  it("a submitted deliverable is always on-track regardless of timing", () => {
    const d = deliverable({ dueAt: iso(2026, 8, 1, 0, 0), completedAt: iso(2026, 8, 2, 0, 0) });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("on-track");
  });

  it("is overdue once the due date has passed and it isn't submitted", () => {
    const d = deliverable({ dueAt: iso(2026, 8, 1, 0, 0) });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("overdue");
  });

  it("is no-estimate when nothing was ever estimated", () => {
    const d = deliverable({ dueAt: iso(2026, 8, 10, 0, 0) });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("no-estimate");
  });

  it("is on-track when remaining effort easily fits in available free time", () => {
    const d = deliverable({ dueAt: iso(2026, 8, 6, 22, 0), estimateMinutes: 30 });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("on-track");
  });

  it("is insufficient-time when remaining effort exceeds all available free time", () => {
    const d = deliverable({ dueAt: iso(2026, 8, 4, 13, 0), estimateMinutes: 10_000 });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("insufficient-time");
  });

  it("is tight when remaining effort uses most (but not all) of the available free time", () => {
    // Free time today from NOW (12:00) to due (13:00) is exactly 60 minutes.
    const d = deliverable({ dueAt: iso(2026, 8, 4, 13, 0), estimateMinutes: 45 });
    expect(workloadRisk(d, [], [], [], NOW, PREFS)).toBe("tight");
  });
});

describe("atRiskDeliverables", () => {
  it("excludes on-track and no-estimate deliverables", () => {
    const onTrack = deliverable({ id: "ok", dueAt: iso(2026, 8, 10, 0, 0), estimateMinutes: 30 });
    const noEstimate = deliverable({ id: "unknown", dueAt: iso(2026, 8, 10, 0, 0) });
    const overdue = deliverable({ id: "late", dueAt: iso(2026, 8, 1, 0, 0) });
    const result = atRiskDeliverables([onTrack, noEstimate, overdue], [], [], [], NOW, PREFS);
    expect(result.map((d) => d.id)).toEqual(["late"]);
  });
});

describe("weekDays", () => {
  it("returns 7 days, Monday first, containing now's day", () => {
    const days = weekDays(NOW);
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days.some((d) => d.getDate() === NOW.getDate())).toBe(true);
  });
});
