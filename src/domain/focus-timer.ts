/**
 * Pure elapsed-time math for a running/paused Focus session — deliberately
 * timestamp-derived, never accumulated by decrementing a counter once per
 * tick. A `setInterval` that does `secondsLeft - 1` drifts the moment a tick
 * is skipped (a backgrounded/throttled tab, the system sleeping), because
 * the *count of ticks that actually fired* silently becomes the source of
 * truth instead of the *real time that actually passed*. Every function
 * here instead takes the session's own timestamps plus a real `now: Date`
 * (the same explicit-`now` convention every other `domain/` module uses)
 * and recomputes from scratch — so a tick that fires late still produces
 * the correct answer, it's just late to display, never wrong.
 */

export type ActiveSessionTiming = {
  sessionLengthSeconds: number;
  /** ISO datetime the session first started. */
  actualStart: string;
  isRunning: boolean;
  /** ISO datetime the current pause began; absent while running. */
  pausedAt?: string;
  /** Total milliseconds spent paused across every *previous* pause —
   *  excludes whatever pause is currently in progress, which is added in
   *  separately via `pausedAt` so it keeps counting while still paused. */
  totalPausedMs: number;
};

/** Real focused seconds elapsed so far — total wall-clock time since start,
 *  minus every pause (finished or still in progress). Never negative. */
export function elapsedSeconds(session: ActiveSessionTiming, now: Date): number {
  const startMs = new Date(session.actualStart).getTime();
  const currentPauseMs = session.pausedAt
    ? Math.max(0, now.getTime() - new Date(session.pausedAt).getTime())
    : 0;
  const pausedMs = session.totalPausedMs + currentPauseMs;
  return Math.max(0, Math.floor((now.getTime() - startMs - pausedMs) / 1000));
}

/** Seconds remaining on the countdown — floored at 0, never negative, even
 *  if real elapsed time has run past the target (a session left running
 *  while the device was asleep, discovered on the next real render). */
export function secondsLeft(session: ActiveSessionTiming, now: Date): number {
  return Math.max(0, session.sessionLengthSeconds - elapsedSeconds(session, now));
}

/** True the instant the countdown has genuinely reached zero, by real
 *  elapsed time — the single condition that means "completed" rather than
 *  "abandoned", whether that's discovered by a live tick or by reopening
 *  the app long after the target time passed. */
export function isSessionComplete(session: ActiveSessionTiming, now: Date): boolean {
  return secondsLeft(session, now) <= 0;
}
