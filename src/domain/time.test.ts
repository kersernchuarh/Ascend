import { describe, expect, it } from "vitest";
import {
  addDays,
  addMinutes,
  completionRate,
  daysUntilDue,
  deadlineRisk,
  endOfDay,
  fromIsoDateLocal,
  isDueToday,
  isOverdue,
  isSameDay,
  remainingMinutes,
  scheduleConflict,
  sortByIsoDate,
  startOfDay,
  startOfWeek,
  toIsoDateLocal,
} from "./time";

// A fixed reference instant — every test passes `now` explicitly (the
// injectable clock these functions are built around), so nothing here
// depends on the real system clock.
const NOW = new Date(2026, 8, 4, 12, 0, 0); // Fri 4 Sep 2026, 12:00 local

function at(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return new Date(year, month, day, hours, minutes).toISOString();
}

describe("startOfDay / endOfDay / isSameDay", () => {
  it("startOfDay zeroes the time on the same calendar day", () => {
    const d = startOfDay(new Date(2026, 8, 4, 23, 59, 59));
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(4);
  });

  it("endOfDay sets the last millisecond of the day", () => {
    const d = endOfDay(new Date(2026, 8, 4, 0, 0, 0));
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getDate()).toBe(4);
  });

  it("isSameDay is true for different times on the same day", () => {
    expect(isSameDay(new Date(2026, 8, 4, 0, 1), new Date(2026, 8, 4, 23, 59))).toBe(true);
  });

  it("fromIsoDateLocal parses a bare YYYY-MM-DD as local midnight, round-tripping with toIsoDateLocal", () => {
    const d = fromIsoDateLocal("2026-09-04");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(4);
    expect(d.getHours()).toBe(0);
    expect(toIsoDateLocal(d)).toBe("2026-09-04");
  });

  it("isSameDay is false across a day boundary", () => {
    expect(isSameDay(new Date(2026, 8, 4, 23, 59), new Date(2026, 8, 5, 0, 1))).toBe(false);
  });
});

describe("toIsoDateLocal", () => {
  it("formats the local calendar date, zero-padded", () => {
    expect(toIsoDateLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("does not shift to a different day the way a UTC-based slice would", () => {
    // A late-evening local time whose UTC equivalent falls on the next
    // calendar day in negative-UTC-offset zones — Date.toISOString().slice
    // would get this wrong depending on the runtime's offset; this must not.
    const d = new Date(2026, 8, 4, 23, 30);
    expect(toIsoDateLocal(d)).toBe("2026-09-04");
  });
});

describe("addDays / addMinutes / startOfWeek", () => {
  it("addDays rolls over a month boundary", () => {
    const d = addDays(new Date(2026, 0, 30), 3); // Jan 30 + 3 = Feb 2
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(2);
  });

  it("addMinutes adds exact minutes", () => {
    const d = addMinutes(new Date(2026, 8, 4, 10, 0), 90);
    expect(d.getHours()).toBe(11);
    expect(d.getMinutes()).toBe(30);
  });

  it("startOfWeek returns the Monday of the given week", () => {
    // 4 Sep 2026 is a Friday.
    const monday = startOfWeek(NOW);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(31); // Mon 31 Aug 2026
  });

  it("startOfWeek handles a Sunday correctly (belongs to the prior Monday)", () => {
    const sunday = new Date(2026, 8, 6); // Sun 6 Sep 2026
    const monday = startOfWeek(sunday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(31);
  });
});

describe("isDueToday", () => {
  it("is true for later today", () => {
    expect(isDueToday(at(2026, 8, 4, 23, 0), NOW)).toBe(true);
  });

  it("is true for earlier today", () => {
    expect(isDueToday(at(2026, 8, 4, 1, 0), NOW)).toBe(true);
  });

  it("is false for tomorrow, even a minute after midnight", () => {
    expect(isDueToday(at(2026, 8, 5, 0, 1), NOW)).toBe(false);
  });

  it("is false for yesterday", () => {
    expect(isDueToday(at(2026, 8, 3, 23, 59), NOW)).toBe(false);
  });
});

describe("isOverdue", () => {
  it("is true once the instant has passed", () => {
    expect(isOverdue(at(2026, 8, 4, 11, 0), NOW)).toBe(true);
  });

  it("is false for a future instant", () => {
    expect(isOverdue(at(2026, 8, 4, 13, 0), NOW)).toBe(false);
  });

  it("is false exactly at `now` (not strictly past)", () => {
    expect(isOverdue(NOW.toISOString(), NOW)).toBe(false);
  });
});

describe("daysUntilDue", () => {
  it("is 0 for today, regardless of time of day", () => {
    expect(daysUntilDue(at(2026, 8, 4, 23, 59), NOW)).toBe(0);
    expect(daysUntilDue(at(2026, 8, 4, 0, 1), NOW)).toBe(0);
  });

  it("is 1 for tomorrow", () => {
    expect(daysUntilDue(at(2026, 8, 5, 0, 1), NOW)).toBe(1);
  });

  it("is -1 for yesterday", () => {
    expect(daysUntilDue(at(2026, 8, 3, 23, 59), NOW)).toBe(-1);
  });

  it("crosses a month boundary correctly", () => {
    const endOfJan = new Date(2026, 0, 30, 12, 0);
    expect(daysUntilDue(at(2026, 1, 2), endOfJan)).toBe(3);
  });

  it("crosses a year boundary correctly", () => {
    const endOfYear = new Date(2026, 11, 30, 12, 0);
    expect(daysUntilDue(at(2027, 0, 2), endOfYear)).toBe(3);
  });
});

describe("remainingMinutes", () => {
  it("is positive for a future instant", () => {
    expect(remainingMinutes(at(2026, 8, 4, 12, 30), NOW)).toBe(30);
  });

  it("is negative for a past instant", () => {
    expect(remainingMinutes(at(2026, 8, 4, 11, 30), NOW)).toBe(-30);
  });

  it("is 0 at exactly `now`", () => {
    expect(remainingMinutes(NOW.toISOString(), NOW)).toBe(0);
  });
});

describe("deadlineRisk", () => {
  it("is overdue once the due date has passed", () => {
    expect(deadlineRisk(at(2026, 8, 3), NOW)).toBe("overdue");
  });

  it("is at-risk when due today", () => {
    expect(deadlineRisk(at(2026, 8, 4, 20, 0), NOW)).toBe("at-risk");
  });

  it("is at-risk at the default threshold boundary (2 days out)", () => {
    expect(deadlineRisk(at(2026, 8, 6), NOW)).toBe("at-risk");
  });

  it("is on-track just past the default threshold (3 days out)", () => {
    expect(deadlineRisk(at(2026, 8, 7), NOW)).toBe("on-track");
  });

  it("respects a custom threshold", () => {
    expect(deadlineRisk(at(2026, 8, 5), NOW, 0)).toBe("on-track");
  });
});

describe("completionRate", () => {
  it("is 0 for an empty list, not NaN", () => {
    expect(completionRate([])).toBe(0);
  });

  it("is 100 when everything is completed", () => {
    expect(completionRate([{ completedAt: "x" }, { completedAt: "y" }])).toBe(100);
  });

  it("rounds a partial rate", () => {
    expect(completionRate([{ completedAt: "x" }, {}, {}])).toBe(33);
  });

  it("is 0 when nothing is completed", () => {
    expect(completionRate([{}, {}])).toBe(0);
  });
});

describe("scheduleConflict", () => {
  it("detects overlapping intervals", () => {
    const a = { startAt: at(2026, 8, 4, 9, 0), endAt: at(2026, 8, 4, 10, 0) };
    const b = { startAt: at(2026, 8, 4, 9, 30), endAt: at(2026, 8, 4, 10, 30) };
    expect(scheduleConflict(a, b)).toBe(true);
  });

  it("does not flag back-to-back intervals as a conflict", () => {
    const a = { startAt: at(2026, 8, 4, 9, 0), endAt: at(2026, 8, 4, 10, 0) };
    const b = { startAt: at(2026, 8, 4, 10, 0), endAt: at(2026, 8, 4, 11, 0) };
    expect(scheduleConflict(a, b)).toBe(false);
  });

  it("does not flag intervals with a gap", () => {
    const a = { startAt: at(2026, 8, 4, 9, 0), endAt: at(2026, 8, 4, 10, 0) };
    const b = { startAt: at(2026, 8, 4, 11, 0), endAt: at(2026, 8, 4, 12, 0) };
    expect(scheduleConflict(a, b)).toBe(false);
  });

  it("detects one interval fully containing another", () => {
    const a = { startAt: at(2026, 8, 4, 8, 0), endAt: at(2026, 8, 4, 17, 0) };
    const b = { startAt: at(2026, 8, 4, 9, 0), endAt: at(2026, 8, 4, 10, 0) };
    expect(scheduleConflict(a, b)).toBe(true);
  });
});

describe("sortByIsoDate", () => {
  it("sorts ascending by the given ISO field", () => {
    const items = [
      { id: "b", when: at(2026, 8, 5) },
      { id: "a", when: at(2026, 8, 4) },
      { id: "c", when: at(2026, 8, 6) },
    ];
    expect(sortByIsoDate(items, (i) => i.when).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts items with no date last, without dropping them", () => {
    const items = [
      { id: "dated", when: at(2026, 8, 4) },
      { id: "undated", when: undefined },
    ];
    const sorted = sortByIsoDate(items, (i) => i.when);
    expect(sorted.map((i) => i.id)).toEqual(["dated", "undated"]);
  });

  it("does not mutate the input array", () => {
    const items = [{ id: "b", when: at(2026, 8, 5) }, { id: "a", when: at(2026, 8, 4) }];
    const original = [...items];
    sortByIsoDate(items, (i) => i.when);
    expect(items).toEqual(original);
  });
});
