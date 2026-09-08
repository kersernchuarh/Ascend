import { describe, expect, it } from "vitest";
import {
  MIN_MEANINGFUL_SESSION_SECONDS,
  completionHistory,
  habitAdherence,
  habitStreak,
  isHabitDueOn,
  isMeaningfulSessionDuration,
  sessionsOnDay,
  totalFocusedMinutes,
  weeklyActivity,
  weeklyCompletionGrid,
} from "./metrics";
import type { Habit, HabitLog, StudySession } from "./types";

const NOW = new Date(2026, 8, 4, 18, 0, 0); // Fri 4 Sep 2026, 18:00 local

function iso(year: number, month: number, day: number, hours = 0, minutes = 0): string {
  return new Date(year, month, day, hours, minutes).toISOString();
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    label: "Habit",
    cadence: { type: "daily" },
    iconKey: "general",
    color: "primary",
    createdAt: iso(2026, 0, 1),
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

describe("isHabitDueOn", () => {
  it("daily is due every day", () => {
    expect(isHabitDueOn(habit({ cadence: { type: "daily" } }), NOW)).toBe(true);
  });

  it("days_of_week is due only on its listed days (NOW is a Friday, day 5)", () => {
    expect(isHabitDueOn(habit({ cadence: { type: "days_of_week", days: [1, 3, 5] } }), NOW)).toBe(true);
    expect(isHabitDueOn(habit({ cadence: { type: "days_of_week", days: [1, 3] } }), NOW)).toBe(false);
  });

  it("times_per_week is never individually due", () => {
    expect(isHabitDueOn(habit({ cadence: { type: "times_per_week", target: 3 } }), NOW)).toBe(false);
  });
});

describe("habitStreak", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  describe("daily cadence", () => {
    it("is 0 with no logs at all", () => {
      expect(habitStreak(habit(), [], NOW)).toBe(0);
    });

    it("is 0 if today has no log, even with a long past streak", () => {
      const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-02"), log("h1", "2026-09-03")];
      expect(habitStreak(habit(), logs, NOW)).toBe(0);
    });

    it("counts consecutive days ending today", () => {
      const logs = [log("h1", "2026-09-02"), log("h1", "2026-09-03"), log("h1", "2026-09-04")];
      expect(habitStreak(habit(), logs, NOW)).toBe(3);
    });

    it("stops at the first gap", () => {
      const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-03"), log("h1", "2026-09-04")];
      expect(habitStreak(habit(), logs, NOW)).toBe(2);
    });

    it("ignores logs for a different habit", () => {
      const logs = [log("other", "2026-09-04"), log("other", "2026-09-03")];
      expect(habitStreak(habit(), logs, NOW)).toBe(0);
    });
  });

  describe("days_of_week cadence", () => {
    // NOW is Friday 4 Sep 2026. Mon 31 Aug, Wed 2 Sep, Fri 4 Sep are the due days.
    const cadence = { type: "days_of_week" as const, days: [1, 3, 5] };

    it("skips non-due days without breaking the streak", () => {
      const logs = [log("h1", "2026-08-31"), log("h1", "2026-09-02"), log("h1", "2026-09-04")];
      expect(habitStreak(habit({ cadence }), logs, NOW)).toBe(3);
    });

    it("breaks on a missed due day even though surrounding non-due days are skipped", () => {
      // Wed 2 Sep missing — Mon 31 Aug should not be reached.
      const logs = [log("h1", "2026-08-31"), log("h1", "2026-09-04")];
      expect(habitStreak(habit({ cadence }), logs, NOW)).toBe(1);
    });

    it("is 0 if today is a due day with no log yet", () => {
      expect(habitStreak(habit({ cadence }), [], NOW)).toBe(0);
    });
  });

  describe("times_per_week cadence", () => {
    const cadence = { type: "times_per_week" as const, target: 2 };

    it("is 0 with no logs at all", () => {
      expect(habitStreak(habit({ cadence }), [], NOW)).toBe(0);
    });

    it("counts the current week once it already meets target", () => {
      const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-03")]; // 2 this week, target met
      expect(habitStreak(habit({ cadence }), logs, NOW)).toBe(1);
    });

    it("does not break the streak when the current week hasn't met target yet (it's just not counted)", () => {
      const logs = [
        log("h1", "2026-08-24"), // previous week (Aug 24-30): 2 logs -> met
        log("h1", "2026-08-25"),
        log("h1", "2026-09-04"), // current week: only 1 log so far -> not yet met, but not a break
      ];
      expect(habitStreak(habit({ cadence }), logs, NOW)).toBe(1); // just the one fully-met past week
    });

    it("breaks at the first past week that didn't meet target", () => {
      const logs = [
        log("h1", "2026-08-31"),
        log("h1", "2026-09-01"), // current week: 2 -> met, streak = 1
        // previous week (Aug 24-30): 0 logs -> not met, breaks here
        log("h1", "2026-08-17"), // two weeks back -> never reached
      ];
      expect(habitStreak(habit({ cadence }), logs, NOW)).toBe(1);
    });
  });
});

describe("habitAdherence", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  it("times_per_week: completed-so-far vs the full weekly target, no elapsed adjustment", () => {
    const cadence = { type: "times_per_week" as const, target: 4 };
    const logs = [log("h1", "2026-09-01"), log("h1", "2026-09-03")];
    expect(habitAdherence(habit({ cadence }), logs, NOW)).toEqual({ completed: 2, target: 4 });
  });

  it("daily: target is days elapsed so far this week (Mon..Fri = 5), not the full 7", () => {
    // NOW is Friday -> Mon,Tue,Wed,Thu,Fri elapsed = 5 due days.
    const logs = [log("h1", "2026-08-31"), log("h1", "2026-09-01"), log("h1", "2026-09-04")];
    expect(habitAdherence(habit({ cadence: { type: "daily" } }), logs, NOW)).toEqual({ completed: 3, target: 5 });
  });

  it("days_of_week: only counts due days elapsed so far", () => {
    // Due Mon/Wed/Fri; by Friday, all three have elapsed.
    const cadence = { type: "days_of_week" as const, days: [1, 3, 5] };
    const logs = [log("h1", "2026-08-31"), log("h1", "2026-09-04")]; // Mon + Fri logged, Wed missed
    expect(habitAdherence(habit({ cadence }), logs, NOW)).toEqual({ completed: 2, target: 3 });
  });

  it("is honestly zero-over-zero shaped with no logs and no elapsed due days conceptually possible", () => {
    const cadence = { type: "days_of_week" as const, days: [0] }; // only Sunday, hasn't occurred yet this week
    expect(habitAdherence(habit({ cadence }), [], NOW)).toEqual({ completed: 0, target: 0 });
  });
});

describe("completionHistory", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  it("returns weeks*7 days ending with the current week", () => {
    const grid = completionHistory([], "h1", NOW, 4);
    expect(grid).toHaveLength(28);
    expect(grid[0].date.getDay()).toBe(1); // Monday
    expect(grid[27].date.getDay()).toBe(0); // Sunday, end of current week
  });

  it("marks logged days across multiple weeks", () => {
    const logs = [log("h1", "2026-08-24"), log("h1", "2026-09-04")];
    const grid = completionHistory(logs, "h1", NOW, 4);
    const completedDates = grid.filter((d) => d.completed).map((d) => d.date.getDate());
    expect(completedDates).toEqual([24, 4]);
  });
});

describe("weeklyCompletionGrid", () => {
  function log(habitId: string, date: string): HabitLog {
    return { id: `${habitId}-${date}`, habitId, date };
  }

  it("returns 7 days, Monday first, all false with no logs", () => {
    const grid = weeklyCompletionGrid([], "h1", NOW);
    expect(grid).toHaveLength(7);
    expect(grid.every((d) => !d.completed)).toBe(true);
    expect(grid[0].date.getDay()).toBe(1); // Monday
    expect(grid[6].date.getDay()).toBe(0); // Sunday
  });

  it("marks exactly the logged days, in order", () => {
    const logs = [log("h1", "2026-08-31"), log("h1", "2026-09-02"), log("h1", "2026-09-04")];
    const grid = weeklyCompletionGrid(logs, "h1", NOW);
    expect(grid.map((d) => d.completed)).toEqual([true, false, true, false, true, false, false]);
  });

  it("ignores logs for a different habit or a different week", () => {
    const logs = [log("other", "2026-09-02"), log("h1", "2026-09-07")]; // next week
    const grid = weeklyCompletionGrid(logs, "h1", NOW);
    expect(grid.every((d) => !d.completed)).toBe(true);
  });
});
