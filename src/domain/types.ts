import type { PillarId } from "@/lib/pillars";
import type { AccentColor } from "@/lib/colors";
import type { HabitIconKey } from "@/lib/habit-icons";

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
 * - `priority` — nothing sets or reads it; due-date proximity already drives
 *   the only prioritisation signal that exists (`deadlineRisk`).
 * - `subjectId` — a task reaches a `Subject` only via its `Deliverable`.
 *   Giving `Task` its own `subjectId` alongside `deliverableId` would let
 *   the two disagree (a task filed under Chemistry whose deliverable is a
 *   Math problem set); one path to Subject is enough.
 *
 * `status` is deliberately not a separate field: it is fully determined by
 * whether `completedAt` is set, and keeping both would let them disagree.
 *
 * `pillar` and `notes` were widened/added for the "quick capture" milestone
 * (PRODUCT_BLUEPRINT.md §29): a task jotted down in five seconds shouldn't
 * force a pillar choice it doesn't have yet. Both are purely additive to
 * the stored shape — every task written before this change already has a
 * real `pillar` and simply has no `notes`, which the optional type already
 * represents correctly, so no data migration or repository version bump is
 * needed. Anywhere a screen reads `task.pillar`, it must treat `undefined`
 * as a real, displayable state ("no pillar assigned") rather than crash or
 * fall back to a fabricated default.
 */
export type Task = {
  id: string;
  title: string;
  /** Optional: a quick-captured task may have no pillar yet. Never defaulted
   *  to a guessed value — see the type-level doc comment above. */
  pillar?: PillarId;
  /** When the task was created. */
  createdAt: string;
  /** ISO datetime the task was marked done; absent means still outstanding.
   *  This is the single source of truth for completion — never a separate
   *  boolean alongside it. */
  completedAt?: string;
  /** ISO datetime the user plans to do this — not a hard deadline, just a
   *  planned moment (e.g. "call mom at 8pm"). Optional: a task may have no
   *  specific time and simply live in a backlog.
   *
   *  Deliberately independent of `dueAt`: this is *when the user intends to
   *  work on it*, `dueAt` is *when it's actually due*. Clearing this (a
   *  "defer" — see `state/task-context.removeFromToday`) must never touch
   *  `dueAt`, and nothing in this codebase should ever derive one from the
   *  other. */
  scheduledFor?: string;
  /** Planned effort in minutes, for future estimate-vs-actual comparison
   *  (blueprint §10) once sessions exist. Also the field a user updates to
   *  record "how much is actually left" after stopping a Focus Session
   *  before finishing. */
  estimateMinutes?: number;
  /** A task's own due date/time — for a standalone dated task with no
   *  `Deliverable` ("renew library card by Friday"). When the task *is*
   *  linked to a `deliverableId`, callers should prefer the deliverable's
   *  `dueAt` for display (see `domain/work.effectiveDueAt`) and treat this
   *  as an override, not a duplicate of it. */
  dueAt?: string;
  /** Optional link to the `Deliverable` this task contributes toward. */
  deliverableId?: string;
  /** Free-text notes — assignment instructions, a resource link, a reminder
   *  of where things were left. Rendered with plain URLs auto-linked
   *  (`components/shared/linkified-text.tsx`) rather than a separate `url`
   *  field, since a task has at most one thing to say here and a second
   *  field would just invite the two to disagree about which one is "the"
   *  link. */
  notes?: string;
};

/** An academic course or personal area of work — "Chemistry", "History",
 *  "CS Assignment prep". Owns no data of its own beyond a name; exists only
 *  to group `Deliverable`s the way the student actually thinks about their
 *  work (PRODUCT_BLUEPRINT.md §6.2, §7.2's `Work` section). No `pillar` or
 *  `color`: a subject's deliverables already carry pillar identity, and a
 *  second, possibly-disagreeing color would just be visual noise. */
export type Subject = {
  id: string;
  name: string;
  createdAt: string;
};

/** A graded or externally-due artefact — "Chemistry lab report", "CS
 *  Assignment 2". Distinct from `Task`: a deliverable is a thing that comes
 *  due, a task is an action the user takes toward it (blueprint §6.1's
 *  resolution of the Task/Deadline overlap — this type replaces `Deadline`
 *  outright, extended with the fields a real Work page needs). No `status`
 *  enum, for the same reason as `Task`: completion is `completedAt`
 *  presence, meaning "submitted". No `weight` — nothing reads it yet. */
export type Deliverable = {
  id: string;
  title: string;
  pillar: PillarId;
  /** Optional grouping under a `Subject`. Absent means it shows in Work's
   *  "Unassigned" group rather than under any subject — not every deliverable
   *  is academic (e.g. a "Dentist appointment" follow-up form). */
  subjectId?: string;
  /** ISO datetime the deliverable is due. When `allDay` is true this is set
   *  to the end of that calendar day (see `domain/time.endOfDay`) — a real
   *  instant to compare against, without inventing a submission time nobody
   *  actually specified. */
  dueAt: string;
  /** True when only the day is known ("due tomorrow"), not a specific time. */
  allDay: boolean;
  /** Planned effort in minutes — comparable against sessions logged toward
   *  this deliverable's tasks (`domain/work.loggedMinutesForDeliverable`). */
  estimateMinutes?: number;
  /** Free-text notes — assignment instructions, a rubric link. Unlike
   *  `Task`, a deliverable is durable and detail-bearing enough that this
   *  has a real use even before any screen needs `Task.description`. */
  description?: string;
  createdAt: string;
  /** ISO datetime marked "submitted"; absent means still outstanding. */
  completedAt?: string;
};

/**
 * A fixed, non-movable block of time — a class, a CCA, an appointment.
 * Deliberately modeled as **inherently weekly-recurring**, not an absolute
 * datetime with an optional `recurrenceRule` bolted on: a real fixed
 * commitment (school hours, a standing CCA) repeats every week, and forcing
 * a user to re-enter it every week just because full recurrence rules
 * (RRULE-style exceptions, date ranges) weren't built would defeat the
 * point of entering it at all. A one-off, single-date commitment already
 * has a home — a `Task` with `scheduledFor` + `estimateMinutes` — so this
 * type doesn't need to cover that case.
 */
export type CalendarEvent = {
  id: string;
  title: string;
  kind: "class" | "cca" | "appointment" | "personal";
  /** 0=Sunday..6=Saturday, matching `Date.getDay()`. */
  dayOfWeek: number;
  /** Minutes since local midnight the event starts. */
  startMinutes: number;
  durationMinutes: number;
  createdAt: string;
};

/**
 * The small set of preferences that materially change the free-time engine
 * (blueprint §15) — deliberately minimal: no `weekStartsOn`, `pillarTargets`,
 * `subjects[]`, or `onboardingCompletedAt` yet, none of which has a
 * consumer built. A true singleton (one row, not a collection), stored
 * through the same `Repository<T>` used everywhere else with a fixed id
 * rather than inventing a second persistence primitive for one object.
 */
export type UserPreferences = {
  id: "singleton";
  /** Hour (0-23) the waking window starts/ends — `domain/plan.wakingWindow`'s
   *  real input, replacing what were hardcoded constants. */
  wakingStartHour: number;
  wakingEndHour: number;
  /** Optional — unset by default. Asserting an implicit quiet-hours cutoff
   *  the user never chose would be exactly the fabricated-default mistake
   *  this product has avoided everywhere else (see `Habit.cadence`'s docs
   *  for the same reasoning). */
  quietHoursStart?: number;
  quietHoursEnd?: number;
  /** Minutes — replaces the hardcoded `STUDY_SESSION_SECONDS`. */
  sessionLengthMinutes: number;
  /** Set the instant the user picks "start fresh" or "explore the sample"
   *  on first run; `undefined` is what actually gates the welcome screen
   *  (`components/onboarding/welcome-screen.tsx`) — never backfilled or
   *  assumed, since a missing value here is a real, meaningful "hasn't
   *  decided yet", not an oversight to paper over with a default. */
  onboardingCompletedAt?: string;
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
  /** Optional direct association with a `Deliverable`, for focus time not
   *  tied to any one task (blueprint §6.3: "a Session logs work on a Task or
   *  directly on a Deliverable"). No picker sets this yet — Focus Sessions
   *  currently only ever attach via `taskId` — but the field is real and
   *  read by `domain/work.loggedMinutesForDeliverable`. */
  deliverableId?: string;
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

/** How often a `Habit` is expected, and against what target — what makes a
 *  bare completion count into a real adherence figure (blueprint §12). The
 *  smallest set that covers "every day", "specific days", and "some number
 *  of times, any days" without inventing cases nothing asks for. No
 *  separate top-level `target` field on `Habit`: it would be meaningless
 *  for `daily`/`days_of_week` (the days themselves already say what's
 *  expected), so it lives only in the variant that needs it. */
export type HabitCadence =
  | { type: "daily" }
  /** `days`: 0=Sunday..6=Saturday, matching `Date.getDay()`. */
  | { type: "days_of_week"; days: number[] }
  | { type: "times_per_week"; target: number };

/** A recurring behaviour the user tracks. Owns no statistic — see `HabitLog`. */
export type Habit = {
  id: string;
  label: string;
  /** Optional reminder of what the habit actually means to the user (e.g.
   *  "20 pages" for Reading) — durable and user-authored enough to earn a
   *  field, the same reasoning `Deliverable.description` used; unlike
   *  `Task`, nothing here is a fast, disposable action. */
  description?: string;
  cadence: HabitCadence;
  /** A key into `lib/habit-icons.HABIT_ICON_MAP`, resolved to a real
   *  component only at render time — deliberately not the component itself,
   *  which isn't JSON-serializable and comes back broken after a
   *  `localStorage` round-trip (a real bug live testing caught). */
  iconKey: HabitIconKey;
  color: AccentColor;
  createdAt: string;
  /** ISO datetime the habit was archived; absent means active. Archiving is
   *  the only removal a `Habit` supports — never a real delete — because its
   *  `HabitLog` history must survive (blueprint §16's referential-integrity
   *  rule for Habits and Subjects). An archived habit stops appearing in
   *  "due today" surfaces but its logs, streak and history remain intact. */
  archivedAt?: string;
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
