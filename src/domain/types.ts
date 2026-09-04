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
 * A block of focused work. Modeled now so the shape exists and is tested,
 * but deliberately NOT wired to the Study Timer yet: without persistence
 * (Phase 2) there is nowhere honest to keep a log, and binding the timer to
 * an entity that vanishes on reload would be its own kind of fabrication.
 * Phase 3 ("Sessions: the atomic unit") is where this becomes real.
 */
export type StudySession = {
  id: string;
  taskId?: string;
  deadlineId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
};

/** A recurring behaviour the user tracks. Owns no statistic — see `HabitLog`. */
export type Habit = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: AccentColor;
};

/** A dated observation for a habit. Replaces the old `HabitEntry.value`,
 *  which was a bare percentage with no period attached — a number with no
 *  date is unfalsifiable. This ties every value to a specific day; it does
 *  not yet compute streaks, cadence or trends across days, which need
 *  accumulated real history and are Phase 7's job (blueprint §12). */
export type HabitLog = {
  id: string;
  habitId: string;
  /** ISO date (no time) this observation is for. */
  date: string;
  /** 0-100. Still a seeded/mock value in Phase 1 — the fix here is temporal
   *  honesty (every value is now dated), not that the number is "real". */
  value: number;
};
