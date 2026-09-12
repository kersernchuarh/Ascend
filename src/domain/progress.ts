import { fromIsoDateLocal } from "./time";
import { currentWeekPeriod, isWithinPeriod, previousWeekPeriod, type Period } from "./periods";
import { loggedMinutesForDeliverable } from "./work";
import type { Deliverable, HabitLog, StudySession, Task } from "./types";
import type { PillarId } from "@/lib/pillars";

/**
 * Progress-specific rollups (PRODUCT_BLUEPRINT.md's Habits + Progress
 * phase, §13). Every function here is a plain derivation over entities the
 * caller already has — nothing is stored, nothing is a rolling average
 * dressed up as a trend. Deliberately reuses `domain/work.ts`'s
 * `loggedMinutesForDeliverable` and `domain/metrics.ts`'s conventions rather
 * than recomputing "minutes from a session" a third way.
 */

function sessionsInPeriod(sessions: StudySession[], period: Period): StudySession[] {
  return sessions.filter((s) => isWithinPeriod(s.actualStart, period));
}

function minutesOf(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => {
    const minutes = (new Date(s.actualEnd).getTime() - new Date(s.actualStart).getTime()) / 60_000;
    return sum + Math.round(minutes);
  }, 0);
}

function tasksCompletedInPeriod(tasks: Task[], period: Period): number {
  return tasks.filter((t) => t.completedAt != null && isWithinPeriod(t.completedAt, period)).length;
}

export type WeekFigures = { sessionCount: number; focusedMinutes: number; tasksCompleted: number };
export type WeekInReview = WeekFigures & {
  /** `null` means no real previous-week data exists at all — the caller
   *  must show "not enough history yet", never a fabricated 0-vs-0 delta. */
  previous: WeekFigures | null;
};

/**
 * The current week's real figures, plus the previous week's — only when the
 * previous week actually has at least one real record. A silent, all-zero
 * previous week (the common case for a brand-new user) is indistinguishable
 * from "no history" and must not be presented as a comparison.
 */
export function weekInReview(sessions: StudySession[], tasks: Task[], now: Date): WeekInReview {
  const current = currentWeekPeriod(now);
  const previous = previousWeekPeriod(now);
  const currentSessions = sessionsInPeriod(sessions, current);
  const previousSessions = sessionsInPeriod(sessions, previous);
  const previousTasksCompleted = tasksCompletedInPeriod(tasks, previous);
  const hasPreviousData = previousSessions.length > 0 || previousTasksCompleted > 0;

  return {
    sessionCount: currentSessions.length,
    focusedMinutes: minutesOf(currentSessions),
    tasksCompleted: tasksCompletedInPeriod(tasks, current),
    previous: hasPreviousData
      ? {
          sessionCount: previousSessions.length,
          focusedMinutes: minutesOf(previousSessions),
          tasksCompleted: previousTasksCompleted,
        }
      : null,
  };
}

export type PillarWorkload = { pillar: PillarId; remainingMinutes: number };

/**
 * Remaining estimated minutes, grouped by pillar, across every outstanding
 * `Task` and `Deliverable` that actually has an estimate — an item with no
 * estimate contributes nothing rather than a guessed duration. Sorted
 * heaviest first; a pillar with zero real remaining-and-estimated work
 * simply doesn't appear (no synthetic zero row).
 */
export function workloadByPillar(tasks: Task[], deliverables: Deliverable[]): PillarWorkload[] {
  const totals = new Map<PillarId, number>();
  const add = (pillar: PillarId, minutes: number | undefined) => {
    if (!minutes) return;
    totals.set(pillar, (totals.get(pillar) ?? 0) + minutes);
  };
  for (const task of tasks) {
    // A quick-captured task may have no pillar yet — it contributes nothing
    // to this breakdown rather than being guessed into one (no fabricated
    // bucket), same principle as the missing-estimate case above.
    if (task.completedAt == null && task.pillar) add(task.pillar, task.estimateMinutes);
  }
  for (const deliverable of deliverables) {
    if (deliverable.completedAt == null) add(deliverable.pillar, deliverable.estimateMinutes);
  }
  return Array.from(totals.entries())
    .map(([pillar, remainingMinutes]) => ({ pillar, remainingMinutes }))
    .sort((a, b) => b.remainingMinutes - a.remainingMinutes);
}

export type EstimateAccuracy = { sampleSize: number; estimatedMinutes: number; actualMinutes: number; ratio: number };

/**
 * Estimated vs. actually-logged minutes, across every completed deliverable
 * that has BOTH a real estimate AND at least one real logged session —
 * `null` (not zero, not a guess) when no deliverable qualifies yet, which
 * is the honest state for most of a term. A deliverable someone completed
 * without ever starting a Focus Session for it is excluded, not assumed to
 * have taken exactly the estimated time.
 */
export function estimateAccuracy(
  deliverables: Deliverable[],
  tasks: Task[],
  sessions: StudySession[]
): EstimateAccuracy | null {
  let estimatedMinutes = 0;
  let actualMinutes = 0;
  let sampleSize = 0;

  for (const deliverable of deliverables) {
    if (deliverable.completedAt == null || !deliverable.estimateMinutes) continue;
    const logged = loggedMinutesForDeliverable(sessions, tasks, deliverable.id);
    if (logged <= 0) continue;
    estimatedMinutes += deliverable.estimateMinutes;
    actualMinutes += logged;
    sampleSize += 1;
  }

  if (sampleSize === 0) return null;
  return { sampleSize, estimatedMinutes, actualMinutes, ratio: actualMinutes / estimatedMinutes };
}

export type WeeklyJuxtaposition = { focusedMinutes: number; habitDaysLogged: number };

/**
 * The honest version of "load vs wellbeing" (blueprint §13.3): real focused
 * minutes next to the real count of distinct days with at least one habit
 * logged, this week — a juxtaposition for the user to notice, never a
 * computed correlation coefficient (which needs far more data and rigor
 * than a single week can honestly support). `null` unless BOTH signals are
 * real this week; either one alone isn't the comparison this is for.
 */
export function weeklyFocusHabitJuxtaposition(
  sessions: StudySession[],
  logs: HabitLog[],
  now: Date
): WeeklyJuxtaposition | null {
  const period = currentWeekPeriod(now);
  const focusedMinutes = minutesOf(sessionsInPeriod(sessions, period));
  const periodStart = new Date(period.startAt).getTime();
  const periodEnd = new Date(period.endAt).getTime();
  const daysLogged = new Set(
    logs
      .filter((log) => {
        const t = fromIsoDateLocal(log.date).getTime();
        return t >= periodStart && t < periodEnd;
      })
      .map((log) => log.date)
  );

  if (focusedMinutes <= 0 || daysLogged.size === 0) return null;
  return { focusedMinutes, habitDaysLogged: daysLogged.size };
}
