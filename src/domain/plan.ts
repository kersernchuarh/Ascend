import { addDays, isOverdue, isSameDay, scheduleConflict, startOfDay, startOfWeek, type Interval } from "./time";
import { loggedMinutesForDeliverable } from "./work";
import type { CalendarEvent, Deliverable, StudySession, Task } from "./types";

/**
 * The deterministic free-time / workload engine (PRODUCT_BLUEPRINT.md §11,
 * §16's `freeTime`/`remainingEffort`/`risk` rows). Every function here is
 * pure and takes `now` explicitly, the same injectable-clock discipline as
 * `domain/time.ts` and `domain/metrics.ts` — no AI, nothing hidden, every
 * number traces to real entities a caller already has.
 */

/** Placeholder waking-hours default, pending a real `UserPreferences`
 *  surface (blueprint §6.2, §15) — same status as `STUDY_SESSION_SECONDS`
 *  before Settings exists: a reasonable constant, not a fabricated one. */
export const WAKING_START_HOUR = 7;
export const WAKING_END_HOUR = 23;

/** The full waking window for the calendar day `day` falls on. */
export function wakingWindow(day: Date): Interval {
  const start = startOfDay(day);
  start.setHours(WAKING_START_HOUR, 0, 0, 0);
  const end = startOfDay(day);
  end.setHours(WAKING_END_HOUR, 0, 0, 0);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

/** Sorts and merges overlapping or touching intervals into their union —
 *  the standard interval-merge algorithm, so a lunch class overlapping a
 *  scheduled task isn't double-subtracted from free time. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && new Date(interval.startAt).getTime() <= new Date(last.endAt).getTime()) {
      if (new Date(interval.endAt).getTime() > new Date(last.endAt).getTime()) {
        last.endAt = interval.endAt;
      }
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

/** The open gaps in `window` once `busy` (assumed already merged) is
 *  removed — clipped to `window`'s own bounds. This is "when are the
 *  available work blocks", not just a total-minutes count. */
export function freeIntervals(window: Interval, busy: Interval[]): Interval[] {
  const windowStart = new Date(window.startAt).getTime();
  const windowEnd = new Date(window.endAt).getTime();
  if (windowEnd <= windowStart) return [];

  const relevant = mergeIntervals(busy)
    .map((interval) => ({
      start: Math.max(new Date(interval.startAt).getTime(), windowStart),
      end: Math.min(new Date(interval.endAt).getTime(), windowEnd),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);

  const gaps: Interval[] = [];
  let cursor = windowStart;
  for (const busyInterval of relevant) {
    if (busyInterval.start > cursor) {
      gaps.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(busyInterval.start).toISOString() });
    }
    cursor = Math.max(cursor, busyInterval.end);
  }
  if (cursor < windowEnd) {
    gaps.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(windowEnd).toISOString() });
  }
  return gaps;
}

function sumMinutes(intervals: Interval[]): number {
  return intervals.reduce(
    (sum, interval) => sum + (new Date(interval.endAt).getTime() - new Date(interval.startAt).getTime()) / 60_000,
    0
  );
}

/**
 * The planned work block a task represents, or `undefined` if it isn't one.
 * Deliberately narrow: a task only becomes a real, time-subtracting block
 * when it has BOTH `scheduledFor` (a specific moment) AND `estimateMinutes`
 * (a real duration) — a due date alone is not scheduled work (this
 * product's own stated rule), and a scheduled task with no estimate has no
 * duration anyone actually specified, so it contributes nothing rather than
 * a guessed one. Completed tasks return `undefined` too: their real time is
 * either already reflected in a logged `StudySession`, or was never logged
 * at all — either way, re-asserting the estimate as "used" would risk
 * double-counting or fabricating a duration nobody confirmed.
 */
export function taskWorkBlock(task: Task): Interval | undefined {
  if (task.completedAt != null) return undefined;
  if (!task.scheduledFor || task.estimateMinutes == null) return undefined;
  const start = new Date(task.scheduledFor);
  const end = new Date(start.getTime() + task.estimateMinutes * 60_000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

/** Every real, time-consuming interval on `day`: fixed `CalendarEvent`s,
 *  `StudySession`s that actually happened, and scheduled-but-incomplete
 *  task blocks. Not merged — callers needing the union should merge
 *  themselves (`mergeIntervals`); `dayConflicts` below needs them unmerged
 *  precisely to detect overlaps between them. */
export function busyIntervalsForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: Task[],
  sessions: StudySession[]
): Interval[] {
  const fixed: Interval[] = events
    .filter((event) => isSameDay(new Date(event.startAt), day))
    .map((event) => ({ startAt: event.startAt, endAt: event.endAt }));
  const logged: Interval[] = sessions
    .filter((session) => isSameDay(new Date(session.actualStart), day))
    .map((session) => ({ startAt: session.actualStart, endAt: session.actualEnd }));
  const scheduled = tasks
    .filter((task) => task.scheduledFor && isSameDay(new Date(task.scheduledFor), day))
    .map((task) => taskWorkBlock(task))
    .filter((block): block is Interval => block != null);
  return [...fixed, ...logged, ...scheduled];
}

/** Real free minutes on `day`. For today, the window starts at `now` — the
 *  product question "how much free time do I have today" means what's
 *  *left*, not the whole day including the past. For any other day, the
 *  full waking window applies. */
export function freeMinutesForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: Task[],
  sessions: StudySession[],
  now: Date
): number {
  const window = wakingWindow(day);
  if (isSameDay(day, now) && now.getTime() > new Date(window.startAt).getTime()) {
    window.startAt = now.toISOString();
  }
  const busy = busyIntervalsForDay(day, events, tasks, sessions);
  return Math.round(sumMinutes(freeIntervals(window, busy)));
}

/** The open work blocks on `day` — "when are the available work blocks?" */
export function freeBlocksForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: Task[],
  sessions: StudySession[],
  now: Date
): Interval[] {
  const window = wakingWindow(day);
  if (isSameDay(day, now) && now.getTime() > new Date(window.startAt).getTime()) {
    window.startAt = now.toISOString();
  }
  const busy = busyIntervalsForDay(day, events, tasks, sessions);
  return freeIntervals(window, busy);
}

/** Whether `day` has any two busy intervals (fixed events or scheduled
 *  tasks — not logged sessions, which are historical fact, not a planning
 *  conflict) that overlap. */
export function dayHasConflict(day: Date, events: CalendarEvent[], tasks: Task[]): boolean {
  const fixed = events.filter((event) => isSameDay(new Date(event.startAt), day));
  const scheduled = tasks
    .filter((task) => task.scheduledFor && isSameDay(new Date(task.scheduledFor), day))
    .map((task) => taskWorkBlock(task))
    .filter((block): block is Interval => block != null);
  const candidates = [...fixed, ...scheduled];
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      if (scheduleConflict(candidates[i], candidates[j])) return true;
    }
  }
  return false;
}

/** `estimateMinutes − logged`, floored at 0. Zero (not a negative number)
 *  once logged time meets or exceeds the estimate — there is no such thing
 *  as "negative remaining work". `undefined` when the deliverable has no
 *  estimate at all: there is nothing honest to compare against. */
export function remainingEffortMinutes(
  deliverable: Deliverable,
  tasks: Task[],
  sessions: StudySession[]
): number | undefined {
  if (deliverable.estimateMinutes == null) return undefined;
  const logged = loggedMinutesForDeliverable(sessions, tasks, deliverable.id);
  return Math.max(0, deliverable.estimateMinutes - logged);
}

/** How many days ahead `freeMinutesUntil` will actually sum — beyond this,
 *  `CalendarEvent` (no recurrence yet) has no data for future weeks, so
 *  projected free time would silently overstate availability. Capping the
 *  horizon keeps that gap disclosed rather than quietly wrong. */
export const FREE_TIME_HORIZON_DAYS = 14;

/** Real free minutes from `now` through `untilIso` (inclusive), summed day
 *  by day. Capped at `FREE_TIME_HORIZON_DAYS` — see its docs. Unlike
 *  `freeMinutesForDay`, the day `untilIso` falls on is clipped to end at
 *  `untilIso` itself, not the full waking window — free time *after* a
 *  deadline doesn't help meet it. */
export function freeMinutesUntil(
  untilIso: string,
  events: CalendarEvent[],
  tasks: Task[],
  sessions: StudySession[],
  now: Date
): number {
  const until = new Date(untilIso);
  let total = 0;
  for (let offset = 0; offset <= FREE_TIME_HORIZON_DAYS; offset += 1) {
    const day = addDays(startOfDay(now), offset);
    if (day.getTime() > until.getTime()) break;

    const window = wakingWindow(day);
    if (isSameDay(day, now) && now.getTime() > new Date(window.startAt).getTime()) {
      window.startAt = now.toISOString();
    }
    if (isSameDay(day, until) && until.getTime() < new Date(window.endAt).getTime()) {
      window.endAt = until.toISOString();
    }
    if (new Date(window.endAt).getTime() <= new Date(window.startAt).getTime()) continue;

    const busy = busyIntervalsForDay(day, events, tasks, sessions);
    total += sumMinutes(freeIntervals(window, busy));
  }
  return Math.round(total);
}

export type WorkloadRisk = "overdue" | "no-estimate" | "insufficient-time" | "tight" | "on-track";

/**
 * The effort-vs-free-time risk PRODUCT_BLUEPRINT.md §16 calls `risk()` —
 * deliberately named differently from `domain/time.deadlineRisk` (a
 * time-proximity heuristic with no idea how much work is left or how much
 * time exists to do it in) so the two are never mistaken for the same
 * signal. A submitted deliverable is always "on-track" — done work carries
 * no risk regardless of timing.
 */
export function workloadRisk(
  deliverable: Deliverable,
  tasks: Task[],
  sessions: StudySession[],
  events: CalendarEvent[],
  now: Date
): WorkloadRisk {
  if (deliverable.completedAt != null) return "on-track";
  if (isOverdue(deliverable.dueAt, now)) return "overdue";

  const remaining = remainingEffortMinutes(deliverable, tasks, sessions);
  if (remaining == null) return "no-estimate";
  if (remaining <= 0) return "on-track";

  const available = freeMinutesUntil(deliverable.dueAt, events, tasks, sessions, now);
  if (available <= 0) return "insufficient-time";

  const ratio = remaining / available;
  if (ratio > 1) return "insufficient-time";
  if (ratio > 0.6) return "tight";
  return "on-track";
}

/** Deliverables whose `workloadRisk` genuinely needs attention — "which
 *  upcoming deadlines are at risk?" Excludes `no-estimate`: with nothing to
 *  compare against, that's an honest "can't assess", not a risk signal. */
export function atRiskDeliverables(
  deliverables: Deliverable[],
  tasks: Task[],
  sessions: StudySession[],
  events: CalendarEvent[],
  now: Date
): Deliverable[] {
  return deliverables.filter((deliverable) => {
    const risk = workloadRisk(deliverable, tasks, sessions, events, now);
    return risk === "overdue" || risk === "insufficient-time" || risk === "tight";
  });
}

/** The seven calendar days (Monday-first) of the week `now` falls in — the
 *  same week `domain/time.startOfWeek` anchors, shared with `WeekStripCard`
 *  and now the Plan week view so both agree on what "this week" means. */
export function weekDays(now: Date): Date[] {
  const monday = startOfWeek(now);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
