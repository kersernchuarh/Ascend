import type { Deliverable } from "./types";

/**
 * Pure, deterministic time utilities. No React, no hidden `new Date()` —
 * every function that needs "now" takes it as an explicit parameter. This is
 * the injectable clock PRODUCT_BLUEPRINT.md §16 asks for: it is what makes
 * these functions reproducible in tests and immune to UI drift (two call
 * sites in the same render always agree, because they were handed the same
 * `now`, typically from `useNow()`).
 *
 * Deliberately not implemented here (not yet justified by the domain —
 * blueprint §16, §19.2): `freeTime`, the effort-vs-free-time `risk`,
 * `streak`, `adherence`, `estimateDrift`, `pillarBalance`. Those need Session
 * history and a free-time engine that don't exist until later phases.
 *
 * No timezone handling — instants are compared in the runtime's local time
 * zone. Deliberate simplification for a single-user client-side prototype
 * (blueprint §11, §26).
 */

/** Midnight, local time, on the same calendar day as `date`. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The last millisecond of the calendar day `date` falls on, local time.
 *  Used to give an "all-day" deadline (one known only by date, not by a
 *  specific time) a real instant to compare against, without pretending a
 *  precise deadline time was ever set. */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** `YYYY-MM-DD` for the LOCAL calendar day `date` falls on. Deliberately
 *  not `date.toISOString().slice(0, 10)` — that normalizes to UTC, which
 *  silently shifts to the wrong calendar day for part of the evening in any
 *  positive-UTC-offset zone (Singapore included, this product's own primary
 *  market). Phase 1's seed habit data had exactly this bug. */
export function toIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inverse of `toIsoDateLocal` — parses a `YYYY-MM-DD` local calendar date
 *  (the exact format `<input type="date">` produces) into midnight local
 *  time on that day. Deliberately not `new Date(dateStr)`: passed a bare
 *  date with no time, that constructor parses it as UTC midnight, which can
 *  silently land on the wrong local calendar day — the same class of bug
 *  `toIsoDateLocal` itself was introduced to avoid on the way out. */
export function fromIsoDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whether `a` and `b` fall on the same calendar day, local time. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday, local time, of the calendar week `date` falls in. Ascend treats
 *  Monday as the first day of the week; there is no user preference for
 *  this yet (that lands in Settings — blueprint §15). */
export function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(date), diffToMonday);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Does `iso` fall on the same calendar day as `now`? */
export function isDueToday(iso: string, now: Date): boolean {
  return isSameDay(new Date(iso), now);
}

/** Has the instant `iso` already passed, relative to `now`? A same-day
 *  deadline is not overdue until its actual instant passes — for an
 *  all-day deadline that instant should be end-of-day (see `endOfDay`),
 *  not midnight, or it would read as overdue for most of its own due day. */
export function isOverdue(iso: string, now: Date): boolean {
  return new Date(iso).getTime() < now.getTime();
}

/** Calendar-day difference between `iso`'s day and `now`'s day: 0 = today,
 *  1 = tomorrow, -1 = yesterday. Compares start-of-day on both sides (not
 *  raw millisecond difference / 24h) so a due date 10 minutes past midnight
 *  tomorrow still correctly reads as "1 day away", not "0". */
export function daysUntilDue(iso: string, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dueDay = startOfDay(new Date(iso)).getTime();
  const today = startOfDay(now).getTime();
  return Math.round((dueDay - today) / msPerDay);
}

/** Exact minutes from `now` until `iso`. Negative once `iso` has passed. */
export function remainingMinutes(iso: string, now: Date): number {
  return Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
}

export type DeadlineRisk = "overdue" | "at-risk" | "on-track";

/**
 * A time-proximity heuristic — NOT the effort-vs-free-time `risk()` from
 * PRODUCT_BLUEPRINT.md §16, which needs Session history and a free-time
 * engine (Phases 3 and 5). This is the honest Phase 1 stepping stone: it
 * only knows how many days remain, nothing about how much work is left or
 * how much free time exists to do it in.
 */
export function deadlineRisk(
  iso: string,
  now: Date,
  atRiskWithinDays = 2
): DeadlineRisk {
  const days = daysUntilDue(iso, now);
  if (days < 0) return "overdue";
  if (days <= atRiskWithinDays) return "at-risk";
  return "on-track";
}

/** Convenience overload of `deadlineRisk` for a `Deliverable` entity. */
export function deadlineRiskFor(deliverable: Deliverable, now: Date): DeadlineRisk {
  return deadlineRisk(deliverable.dueAt, now);
}

/** Percentage (0-100) of `items` with a `completedAt` set. Returns 0 for an
 *  empty list rather than NaN. */
export function completionRate(items: { completedAt?: string }[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((item) => item.completedAt != null).length;
  return Math.round((done / items.length) * 100);
}

export type Interval = { startAt: string; endAt: string };

/** Do two intervals overlap? Touching boundaries (one ends exactly when the
 *  other starts) do not count as a conflict. */
export function scheduleConflict(a: Interval, b: Interval): boolean {
  const aStart = new Date(a.startAt).getTime();
  const aEnd = new Date(a.endAt).getTime();
  const bStart = new Date(b.startAt).getTime();
  const bEnd = new Date(b.endAt).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/** Sort by an ISO date/datetime field. Items with no date sort last, so a
 *  backlog task without a `scheduledFor` doesn't collapse to "earliest". */
export function sortByIsoDate<T>(
  items: T[],
  getIso: (item: T) => string | undefined
): T[] {
  return [...items].sort((a, b) => {
    const aIso = getIso(a);
    const bIso = getIso(b);
    if (!aIso && !bIso) return 0;
    if (!aIso) return 1;
    if (!bIso) return -1;
    return new Date(aIso).getTime() - new Date(bIso).getTime();
  });
}
