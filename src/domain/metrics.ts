import type { HabitLog, StudySession } from "./types";
import { addDays, isSameDay, startOfDay, startOfWeek, toIsoDateLocal } from "./time";

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

/**
 * Consecutive days up to and including `now` for which `habitId` has a
 * completed log, counting backwards from today and stopping at the first
 * gap. Zero if today itself has no log — a streak that hasn't been kept up
 * today isn't "still going".
 */
export function habitStreak(logs: HabitLog[], habitId: string, now: Date): number {
  const loggedDates = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));
  let streak = 0;
  let cursor = startOfDay(now);
  while (loggedDates.has(toIsoDateLocal(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
