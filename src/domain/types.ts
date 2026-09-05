import type { LucideIcon } from "lucide-react";
import type { PillarId } from "@/lib/pillars";
import type { AccentColor } from "@/lib/colors";

/**
 * Canonical domain entities for Ascend. These are DOMAIN DATA: every date or
 * time is a real ISO 8601 string, never a pre-rendered label like "Tomorrow"
 * or "9:00 AM" — that formatting is DISPLAY DATA, derived at render time by
 * `@/lib/format-date` and the utilities in `./time`. See PRODUCT_BLUEPRINT.md
 * §6 and the "Separate DOMAIN DATA from DISPLAY DATA" rule for the reasoning.
 *
 * No timezone handling: all instants are compared in the runtime's local
 * time zone, which is correct for a single-user client-side prototype and a
 * deliberate simplification (blueprint §11, §26).
 */

/**
 * An atomic action, typically well under a day of effort.
 *
 * Fields considered and deliberately excluded, to avoid inventing schema no
 * screen reads yet (PRODUCT_BLUEPRINT.md §6.2, §10):
 * - `description` — nothing renders or edits one today.
 * - `priority` — nothing sets or reads it; due-date proximity already drives
 *   the only prioritisation signal that exists (`deadlineRisk`).
 * - a `projectId`/"project relationship" — there is no Project/Subject entity
 *   yet (that's Phase 4's job). `deadlineId` below is the relationship that
 *   *is* justified today.
 *
 * `status` is deliberately not a separate field: it is fully determined by
 * whether `completedAt` is set, and keeping both would let them disagree.
 */
export type Task = {
  id: string;
  title: string;
  pillar: PillarId;
  /** When the task was created. */
  createdAt: string;
  /** ISO datetime the task was marked done; absent means still outstanding.
   *  This is the single source of truth for completion — never a separate
   *  boolean alongside it. */
  completedAt?: string;
  /** ISO datetime the user plans to do this — not a hard deadline, just a
   *  planned moment (e.g. "call mom at 8pm"). Optional: a task may have no
   *  specific time and simply live in a backlog. */
  scheduledFor?: string;
  /** Planned effort in minutes, for future estimate-vs-actual comparison
   *  (blueprint §10) once sessions exist. */
  estimateMinutes?: number;
  /** Optional link to the `Deadline` this task contributes toward. */
  deadlineId?: string;
};

/** A externally-imposed, dated obligation — "Chemistry lab report due
 *  tomorrow". Distinct from `Task`: a deadline is a thing that comes due, a
 *  task is an action the user takes (see blueprint §6.1's resolution of the
 *  Task/Deadline overlap). No `urgent` flag: urgency is derived from `dueAt`
 *  via `deadlineRisk`, never hand-authored. */
export type Deadline = {
  id: string;
  title: string;
  pillar: PillarId;
  /** ISO datetime the deadline is due. When `allDay` is true this is set to
   *  the end of that calendar day (see `domain/time.endOfDay`) — a real
   *  instant to compare against, without inventing a submission time nobody
   *  actually specified. */
  dueAt: string;
  /** True when only the day is known ("due tomorrow"), not a specific time.
   *  Every seeded deadline today is day-granularity — this is what lets the
   *  formatter show "Tomorrow" instead of a fabricated "Tomorrow, 11:59 PM". */
  allDay: boolean;
  createdAt: string;
};

/** A fixed, non-movable block of time — a class, a CCA, an appointment. */
export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO datetime the event starts. */
  startAt: string;
  /** ISO datetime the event ends. */
  endAt: string;
};

/**
 * A block of focused work — a persisted, immutable record of something the
 * user actually did. Phase 1 modeled this shape but deliberately left every
 * field optional and wired it to nothing, since without persistence there
 * was nowhere honest to keep a log. Now that Phase 2 adds real storage, the
 * fields are required: a `StudySession` is only ever created once it has
 * actually ended, so every timestamp is always known by construction — a
 * "currently running" session is *not* modeled as a `StudySession` at all,
 * it's ordinary ephemeral component state until it finishes.
 */
export type StudySession = {
  id: string;
  /** Optional association with the task being worked on — "when available"
   *  per the product's own framing; plenty of real focus time has no task
   *  attached. */
  taskId?: string;
  deadlineId?: string;
  /** When the session was intended to start — equal to `actualStart` in the
   *  current timer, which has no "schedule for later" concept yet. */
  plannedStart: string;
  /** `plannedStart` + the configured session length. Kept for display
   *  ("planned vs actual") — NOT used to derive `outcome`; see below. */
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  /**
   * Whether the countdown was actually observed reaching zero, or the user
   * stopped it first. Deliberately stored rather than derived by comparing
   * `actualEnd` to `plannedEnd` — an earlier version of this type did
   * exactly that, and live browser testing caught the real bug in it: if
   * the tab is backgrounded, throttled, or the system sleeps mid-session,
   * real wall-clock time can drift past the planned duration even though
   * the countdown the user actually watched never reached zero. Only the
   * running timer knows which happened, at the moment it happens — that's
   * not reconstructable from timestamps afterward, so it's captured
   * directly by whichever code path calls `recordSession`.
   */
  outcome: "completed" | "abandoned";
};

/** A recurring behaviour the user tracks. Owns no statistic — see `HabitLog`. */
export type Habit = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: AccentColor;
};

/**
 * A record that a habit was actually completed on a given day. Presence is
 * the whole fact: there is no `completed: false` row, because "the user
 * hasn't logged this yet" and "the user explicitly marked it not done" are
 * indistinguishable in practice and modeling both would only invite a
 * `completed` field that's always `true` to fall out of sync with nothing.
 * Un-logging a day removes its record entirely (`state/habit-context.tsx`).
 *
 * Replaces Phase 1's `HabitEntry.value: number` (a bare 0-100 percentage
 * with no real record behind it) entirely — streaks, adherence and any
 * future rate all derive from these logs (`domain/metrics.ts`), never
 * stored directly.
 */
export type HabitLog = {
  id: string;
  habitId: string;
  /** Local calendar date, `YYYY-MM-DD`, no time — see
   *  `domain/time.toIsoDateLocal`. Deliberately not derived via
   *  `Date.toISOString()`, which normalizes to UTC and silently shifts to
   *  the wrong calendar day for part of the evening in positive-UTC-offset
   *  zones (Singapore included) — exactly the bug Phase 1's seed data had. */
  date: string;
};
