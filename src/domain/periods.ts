import { addDays, startOfDay, startOfWeek } from "./time";

/**
 * Consistent, reusable period boundaries (PRODUCT_BLUEPRINT.md's Habits +
 * Progress phase, Part 4) — one place for "what does 'this week' mean",
 * rather than each component inlining its own `startOfWeek`/`addDays` math.
 * `endAt` is always the exclusive upper bound (the instant the period ends,
 * not its last millisecond), matching `weeklyActivity`'s existing convention
 * in `domain/metrics.ts`.
 */
export type Period = { startAt: string; endAt: string };

export function todayPeriod(now: Date): Period {
  const start = startOfDay(now);
  return { startAt: start.toISOString(), endAt: addDays(start, 1).toISOString() };
}

/** The Monday-anchored calendar week `now` falls in — the same week
 *  `domain/time.startOfWeek` anchors everywhere else in the app. */
export function currentWeekPeriod(now: Date): Period {
  const monday = startOfWeek(now);
  return { startAt: monday.toISOString(), endAt: addDays(monday, 7).toISOString() };
}

export function previousWeekPeriod(now: Date): Period {
  const monday = addDays(startOfWeek(now), -7);
  return { startAt: monday.toISOString(), endAt: addDays(monday, 7).toISOString() };
}

/** Generalized week lookup: `weeksAgo: 0` is the current week, `1` the one
 *  before it, and so on. `currentWeekPeriod`/`previousWeekPeriod` are the
 *  two callers actually need by name; this is for the handful of places
 *  that walk back an arbitrary number of weeks (e.g. a completion grid). */
export function weekPeriod(now: Date, weeksAgo: number): Period {
  const monday = addDays(startOfWeek(now), -7 * weeksAgo);
  return { startAt: monday.toISOString(), endAt: addDays(monday, 7).toISOString() };
}

/** Whether the instant `iso` falls within `[period.startAt, period.endAt)`. */
export function isWithinPeriod(iso: string, period: Period): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(period.startAt).getTime() && t < new Date(period.endAt).getTime();
}
