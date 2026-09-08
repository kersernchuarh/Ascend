import type { Habit, HabitLog, StudySession } from "./types";
import { addDays, fromIsoDateLocal, isSameDay, startOfDay, startOfWeek, toIsoDateLocal } from "./time";

/**
 * Pure, deterministic statistics over real behavioral records (`StudySession`,
 * `HabitLog`). Nothing here invents a number: every function is a plain
 * derivation over data the caller actually has, and every one returns an
 * honest zero/empty result rather than NaN or a fabricated fallback when
 * there's nothing to compute from yet.
 *
 * Kept separate from `time.ts`, which stays scoped to date/time arithmetic
 * that doesn't know about sessions or habits at all.
 */

/** A session shorter than this is a misclick, not real behavior worth
 *  recording — see `study-timer-card.tsx`. */
export const MIN_MEANINGFUL_SESSION_SECONDS = 60;

export function isMeaningfulSessionDuration(seconds: number): boolean {
  return seconds >= MIN_MEANINGFUL_SESSION_SECONDS;
}

/** Sessions whose `actualStart` falls on `day`. */
export function sessionsOnDay(sessions: StudySession[], day: Date): StudySession[] {
  return sessions.filter((s) => isSameDay(new Date(s.actualStart), day));
}

/** Total real minutes actually spent, across `sessions` that started on
 *  `day` — computed from each session's own start/end, not counted or
 *  estimated any other way. */
export function totalFocusedMinutes(sessions: StudySession[], day: Date): number {
  return sessionsOnDay(sessions, day).reduce((sum, s) => {
    const minutes = (new Date(s.actualEnd).getTime() - new Date(s.actualStart).getTime()) / 60_000;
    return sum + Math.round(minutes);
  }, 0);
}

export type WeeklyActivity = { sessionCount: number; totalMinutes: number };

/** Rollup of real session activity over the Monday-anchored calendar week
 *  containing `now` (see `domain/time.startOfWeek`). */
export function weeklyActivity(sessions: StudySession[], now: Date): WeeklyActivity {
  const monday = startOfWeek(now);
  const weekEnd = addDays(monday, 7); // exclusive upper bound
  const inWeek = sessions.filter((s) => {
    const start = new Date(s.actualStart).getTime();
    return start >= monday.getTime() && start < weekEnd.getTime();
  });
  const totalMinutes = inWeek.reduce((sum, s) => {
    const minutes = (new Date(s.actualEnd).getTime() - new Date(s.actualStart).getTime()) / 60_000;
    return sum + Math.round(minutes);
  }, 0);
  return { sessionCount: inWeek.length, totalMinutes };
}

/** Whether `habit`'s cadence expects it on the calendar day `date` falls on.
 *  `times_per_week` has no single due day — any day can contribute toward
 *  the week's target — so it's never individually "due". */
export function isHabitDueOn(habit: Habit, date: Date): boolean {
  if (habit.cadence.type === "daily") return true;
  if (habit.cadence.type === "days_of_week") return habit.cadence.days.includes(date.getDay());
  return false;
}

/** Active habits actually due *today* — a `times_per_week` habit always
 *  qualifies (any day can contribute toward its weekly target); an archived
 *  habit never does. Shared by Home's `HabitTrackerCard` and
 *  `TodayProgressStrip` so "what's due today" can't drift between the two. */
export function dueTodayHabits(habits: Habit[], now: Date): Habit[] {
  return habits.filter(
    (habit) => !habit.archivedAt && (habit.cadence.type === "times_per_week" || isHabitDueOn(habit, now))
  );
}

/**
 * Consecutive weeks (Monday-anchored) meeting a `times_per_week` habit's
 * target, counting backward from the current week. The current week counts
 * once it has already met target; if it hasn't yet, that's simply excluded
 * from the streak rather than treated as a break — the week isn't over.
 */
function timesPerWeekStreak(
  habitId: string,
  target: number,
  logs: HabitLog[],
  now: Date
): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId);
  const countInWeek = (weekStart: Date) => {
    const weekEnd = addDays(weekStart, 7);
    return habitLogs.filter((l) => {
      const d = fromIsoDateLocal(l.date);
      return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime();
    }).length;
  };

  let streak = 0;
  let weekStart = startOfWeek(now);
  let firstWeek = true;
  for (let weeksChecked = 0; weeksChecked < 520; weeksChecked += 1) {
    const met = countInWeek(weekStart) >= target;
    if (firstWeek) {
      firstWeek = false;
      if (!met) {
        weekStart = addDays(weekStart, -7);
        continue;
      }
    } else if (!met) {
      break;
    }
    streak += 1;
    weekStart = addDays(weekStart, -7);
  }
  return streak;
}

/**
 * Deterministic, cadence-aware streak (blueprint's Habits + Progress
 * phase). Two distinct rules, not one:
 * - `daily` / `days_of_week`: consecutive *due* days up to and including
 *   today with a logged completion, counting backward and stopping at the
 *   first due day with no log. A non-due day is skipped — it neither
 *   extends nor breaks the streak. Zero if today is due and unlogged yet —
 *   a streak that hasn't been kept up today isn't "still going" (the
 *   original daily-only rule, preserved exactly).
 * - `times_per_week`: see `timesPerWeekStreak` — a *week*-level streak
 *   instead of a day-level one, since there's no individual due day to walk
 *   backward through.
 */
export function habitStreak(habit: Habit, logs: HabitLog[], now: Date): number {
  if (habit.cadence.type === "times_per_week") {
    return timesPerWeekStreak(habit.id, habit.cadence.target, logs, now);
  }
  const loggedDates = new Set(logs.filter((l) => l.habitId === habit.id).map((l) => l.date));
  let streak = 0;
  let cursor = startOfDay(now);
  for (let daysChecked = 0; daysChecked < 3650; daysChecked += 1) {
    if (isHabitDueOn(habit, cursor)) {
      if (!loggedDates.has(toIsoDateLocal(cursor))) break;
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type HabitAdherence = { completed: number; target: number };

/**
 * "How well is this habit being kept, against its own cadence, this week?"
 * — never an arbitrary percentage (blueprint's core complaint about the
 * old `HabitEntry.value`).
 * - `times_per_week`: logged-so-far this week vs the full weekly target —
 *   no elapsed-day adjustment, since the target is whole-week by design.
 * - `daily` / `days_of_week`: due-days-logged vs due-days-*elapsed so far*
 *   this week (Monday through today, inclusive) — not `/7`, so a Tuesday
 *   doesn't read as an unfair "2 of 7" before the week has even happened.
 */
export function habitAdherence(habit: Habit, logs: HabitLog[], now: Date): HabitAdherence {
  const habitLogs = logs.filter((l) => l.habitId === habit.id);
  const monday = startOfWeek(now);

  if (habit.cadence.type === "times_per_week") {
    const weekEnd = addDays(monday, 7);
    const completed = habitLogs.filter((l) => {
      const d = fromIsoDateLocal(l.date);
      return d.getTime() >= monday.getTime() && d.getTime() < weekEnd.getTime();
    }).length;
    return { completed, target: habit.cadence.target };
  }

  const elapsedDays = Math.round((startOfDay(now).getTime() - monday.getTime()) / 86_400_000);
  const todayIndex = Math.min(6, Math.max(0, elapsedDays));
  let target = 0;
  let completed = 0;
  for (let i = 0; i <= todayIndex; i += 1) {
    const day = addDays(monday, i);
    if (!isHabitDueOn(habit, day)) continue;
    target += 1;
    if (habitLogs.some((l) => l.date === toIsoDateLocal(day))) completed += 1;
  }
  return { completed, target };
}

export type DayCompletion = { date: Date; completed: boolean };

/**
 * Monday-first, 7-day completion grid for `habitId`, for the calendar week
 * containing `now` (see `domain/time.startOfWeek`). Every entry reflects a
 * real logged date — deliberately still presence-only, not cadence-aware
 * (Home's compact summary just needs "was it logged this day"; a due/not-due
 * distinction is `completionHistory` and the Habits page's job below).
 */
export function weeklyCompletionGrid(
  logs: HabitLog[],
  habitId: string,
  now: Date
): DayCompletion[] {
  const monday = startOfWeek(now);
  const loggedDates = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, completed: loggedDates.has(toIsoDateLocal(date)) };
  });
}

/**
 * `weeklyCompletionGrid`, generalized to `weeks` calendar weeks ending with
 * the current one — the Habits page's longer "recent completion history"
 * (Part 1's spec), still presence-only for the same reason.
 */
export function completionHistory(
  logs: HabitLog[],
  habitId: string,
  now: Date,
  weeks: number
): DayCompletion[] {
  const firstMonday = addDays(startOfWeek(now), -7 * (weeks - 1));
  const loggedDates = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = addDays(firstMonday, i);
    return { date, completed: loggedDates.has(toIsoDateLocal(date)) };
  });
}
