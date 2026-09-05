import { describe, expect, it } from "vitest";
import {
  MIN_MEANINGFUL_SESSION_SECONDS,
  habitStreak,
  isMeaningfulSessionDuration,
  sessionsOnDay,
  totalFocusedMinutes,
  weeklyActivity,
} from "./metrics";
import type { HabitLog, StudySession } from "./types";

const NOW = new Date(2026, 8, 4, 18, 0, 0); // Fri 4 Sep 2026, 18:00 local

function iso(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return new Date(year, month, day, hours, minutes).toISOString();
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

describe("isMeaningfulSessionDuration", () => {
  it("is false below the threshold", () => {
    expect(isMeaningfulSessionDuration(MIN_MEANINGFUL_SESSION_SECONDS - 1)).toBe(false);
  });

  it("is true at and above the threshold", () => {
    expect(isMeaningfulSessionDuration(MIN_MEANINGFUL_SESSION_SECONDS)).toBe(true);
    expect(isMeaningfulSessionDuration(MIN_MEANINGFUL_SESSION_SECONDS + 60)).toBe(true);
  });
});

describe("sessionsOnDay / totalFocusedMinutes", () => {
  it("counts zero minutes and zero sessions for an empty list, not NaN", () => {
    expect(totalFocusedMinutes([], NOW)).toBe(0);
    expect(sessionsOnDay([], NOW)).toEqual([]);
  });

  it("only includes sessions that started on the given day", () => {
    const today = session({ id: "today", actualStart: iso(2026, 8, 4, 9, 0), actualEnd: iso(2026, 8, 4, 9, 45) });
    const yesterday = session({ id: "yesterday", actualStart: iso(2026, 8, 3, 9, 0), actualEnd: iso(2026, 8, 3, 9, 45) });
    const sessions = [today, yesterday];
    expect(sessionsOnDay(sessions, NOW).map((s) => s.id)).toEqual(["today"]);
    expect(totalFocusedMinutes(sessions, NOW)).toBe(45);
  });

  it("sums real elapsed minutes across multiple sessions the same day", () => {
    const a = session({ id: "a", actualStart: iso(2026, 8, 4, 9, 0), actualEnd: iso(2026, 8, 4, 9, 30) });
    const b = session({ id: "b", actualStart: iso(2026, 8, 4, 14, 0), actualEnd: iso(2026, 8, 4, 14, 20) });
    expect(totalFocusedMinutes([a, b], NOW)).toBe(50);
  });

  it("counts an abandoned session's real elapsed time too, not just completed ones", () => {
    // Time actually spent focused is real regardless of whether the full
    // planned duration was reached — see StudySession.outcome's docs for
    // why "completed" is captured directly rather than inferred here.
    const abandoned = session({
      outcome: "abandoned",
      actualStart: iso(2026, 8, 4, 9, 0),
      actualEnd: iso(2026, 8, 4, 9, 12),
    });
    expect(totalFocusedMinutes([abandoned], NOW)).toBe(12);
  });
});

describe("weeklyActivity", () => {
  it("is zero for no sessions", () => {
    expect(weeklyActivity([], NOW)).toEqual({ sessionCount: 0, totalMinutes: 0 });
  });

  it("includes a session on the Monday of the current week", () => {
    const monday = session({ actualStart: iso(2026, 7, 31, 8, 0), actualEnd: iso(2026, 7, 31, 8, 45) });
    expect(weeklyActivity([monday], NOW)).toEqual({ sessionCount: 1, totalMinutes: 45 });
  });

  it("excludes a session from the following week", () => {
    const nextMonday = session({ actualStart: iso(2026, 8, 7, 8, 0), actualEnd: iso(2026, 8, 7, 8, 45) });
    expect(weeklyActivity([nextMonday], NOW)).toEqual({ sessionCount: 0, totalMinutes: 0 });
  });

  it("excludes a session from the previous week", () => {
    const prevSunday = session({ actualStart: iso(2026, 7, 30, 20, 0), actualEnd: iso(2026, 7, 30, 20, 45) });
    expect(weeklyActivity([prevSunday], NOW)).toEqual({ sessionCount: 0, totalMinutes: 0 });
  });
});

describe("habitStreak", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  it("is 0 with no logs at all", () => {
    expect(habitStreak([], "h1", NOW)).toBe(0);
  });

  it("is 0 if today has no log, even with a long past streak", () => {
    const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-02"), log("h1", "2026-09-03")];
    expect(habitStreak(logs, "h1", NOW)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const logs = [log("h1", "2026-09-02"), log("h1", "2026-09-03"), log("h1", "2026-09-04")];
    expect(habitStreak(logs, "h1", NOW)).toBe(3);
  });

  it("stops at the first gap", () => {
    const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-03"), log("h1", "2026-09-04")];
    expect(habitStreak(logs, "h1", NOW)).toBe(2);
  });

  it("ignores logs for a different habit", () => {
    const logs = [log("other", "2026-09-04"), log("other", "2026-09-03")];
    expect(habitStreak(logs, "h1", NOW)).toBe(0);
  });
});
