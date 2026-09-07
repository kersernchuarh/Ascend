import type { Task, Deliverable, CalendarEvent, Habit, Subject, UserPreferences } from "@/domain/types";
import { addDays, endOfDay, startOfDay } from "@/domain/time";

/**
 * Mock data, migrated onto the canonical domain model (PRODUCT_BLUEPRINT.md
 * §6 — see Phase 1). Every date below is a real ISO datetime computed
 * relative to `now`, never a pre-rendered label — the old `CALENDAR_PREVIEW`
 * hardcoded a specific week (Wed the 5th as "today"), which was already
 * wrong the moment the calendar turned over. Formatting ("Tomorrow", "9:00
 * AM") is derived at render time by `@/lib/format-date` and `@/domain/time`.
 *
 * These are FACTORY FUNCTIONS, not module-level constants — deliberately.
 * Pages here build statically, so a `new Date()` evaluated at module scope
 * would freeze "now" at build time, not view time. Callers get `now` from
 * `useNow()` (client-only, post-mount) and pass it in — see
 * `domain/use-now.ts`.
 */

function atToday(now: Date, hours: number, minutes: number): string {
  const d = startOfDay(now);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function atDaysFromNow(
  now: Date,
  days: number,
  hours: number,
  minutes: number
): string {
  const d = startOfDay(addDays(now, days));
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function createSeedTasks(now: Date): Task[] {
  return [
    {
      id: "t1",
      title: "Finish calculus problem set",
      pillar: "academics",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 9, 0),
      completedAt: atToday(now, 9, 15),
      estimateMinutes: 45,
    },
    {
      id: "t2",
      title: "Meditate 10 minutes",
      pillar: "mind",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 8, 30),
      completedAt: atToday(now, 8, 40),
      estimateMinutes: 10,
    },
    {
      id: "t3",
      title: "30 minute run",
      pillar: "health",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 17, 30),
      estimateMinutes: 30,
    },
    {
      id: "t4",
      title: "Review Spanish flashcards",
      pillar: "academics",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 19, 0),
      estimateMinutes: 20,
    },
    {
      // Deliberately no estimateMinutes — a phone call doesn't really have
      // one, and every seed task having an estimate would never exercise
      // the "no estimate" state a real user's own tasks will regularly hit.
      id: "t5",
      title: "Call mom",
      pillar: "life",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 20, 0),
    },
    // Scheduled for tomorrow, not today — stays in `tasks` but must be
    // excluded from `todayTasks`, proving the filter is date-driven rather
    // than "return everything" (the old behaviour).
    {
      id: "t6",
      title: "Pack gym bag for tomorrow",
      pillar: "health",
      createdAt: atToday(now, 20, 30),
      scheduledFor: atDaysFromNow(now, 1, 21, 0),
    },
    // Scheduled yesterday and never completed — real seed data that
    // exercises `isOverdue`, rather than only covering it in unit tests.
    {
      id: "t7",
      title: "Reply to club email",
      pillar: "life",
      createdAt: atDaysFromNow(now, -2, 12, 0),
      scheduledFor: atDaysFromNow(now, -1, 18, 0),
    },
    // No `scheduledFor` at all — a real Work backlog item, linked to the
    // Chemistry lab report deliverable (`d1`, `createSeedDeliverables`).
    // Exercises Work's deliverable→task nesting and Home's "add existing
    // task to today" picker out of the box, rather than only once a user
    // has created their own linked task.
    {
      id: "t8",
      title: "Write lab report conclusion",
      pillar: "academics",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      estimateMinutes: 30,
      deliverableId: "d1",
    },
  ];
}

/** Every seeded academic deliverable below links to one of these — seeded
 *  once, alongside them, on a genuinely first-ever run (see
 *  `SubjectProvider`). A returning user's real subjects, once any exist,
 *  are never replaced by this list. */
export function createSeedSubjects(now: Date): Subject[] {
  return [
    { id: "sub1", name: "Chemistry", createdAt: atDaysFromNow(now, -30, 9, 0) },
    { id: "sub2", name: "History", createdAt: atDaysFromNow(now, -30, 9, 0) },
  ];
}

export function createSeedDeliverables(now: Date): Deliverable[] {
  // All day-granularity: nobody specified an exact submission minute for any
  // of these, so `dueAt` is anchored to end-of-day rather than inventing one.
  const dueInDays = (days: number) => endOfDay(addDays(now, days)).toISOString();
  return [
    {
      id: "d1",
      title: "Chemistry lab report",
      pillar: "academics",
      subjectId: "sub1",
      dueAt: dueInDays(1),
      allDay: true,
      estimateMinutes: 90,
      createdAt: atDaysFromNow(now, -3, 9, 0),
    },
    {
      id: "d2",
      title: "History essay draft",
      pillar: "academics",
      subjectId: "sub2",
      dueAt: dueInDays(3),
      allDay: true,
      estimateMinutes: 120,
      createdAt: atDaysFromNow(now, -5, 9, 0),
    },
    {
      // No subject — deliberately not every deliverable is academic, so
      // Work's "Unassigned" group has a real, seeded reason to exist rather
      // than only ever appearing once a user creates one by hand.
      id: "d3",
      title: "Club meeting prep",
      pillar: "productivity",
      dueAt: dueInDays(5),
      allDay: true,
      createdAt: atDaysFromNow(now, -2, 9, 0),
    },
    {
      id: "d4",
      title: "Dentist appointment",
      pillar: "health",
      dueAt: dueInDays(7),
      allDay: true,
      createdAt: atDaysFromNow(now, -10, 9, 0),
    },
  ];
}

/**
 * Present-state demo fixed commitments — seeded once by
 * `CalendarEventProvider` on a genuinely first-ever run, same pattern as
 * every other seed factory. Weekly-recurring by construction (`dayOfWeek` +
 * minute offsets — see `CalendarEvent`'s docs), so unlike the old
 * `startAt`/`endAt` seed this doesn't need `now` to place events in "this
 * week" — it only uses `now` for a realistic `createdAt`.
 */
export function createSeedCalendarEvents(now: Date): CalendarEvent[] {
  const createdAt = atDaysFromNow(now, -30, 9, 0);
  return [
    { id: "c1", title: "Morning classes", kind: "class", dayOfWeek: 1, startMinutes: 8 * 60, durationMinutes: 7 * 60, createdAt },
    { id: "c2", title: "Chemistry practical", kind: "class", dayOfWeek: 3, startMinutes: 8 * 60, durationMinutes: 2 * 60, createdAt },
    { id: "c3", title: "Debate club", kind: "cca", dayOfWeek: 3, startMinutes: 16 * 60, durationMinutes: 90, createdAt },
    { id: "c4", title: "Morning classes", kind: "class", dayOfWeek: 4, startMinutes: 8 * 60, durationMinutes: 7 * 60, createdAt },
    { id: "c5", title: "Morning classes", kind: "class", dayOfWeek: 5, startMinutes: 8 * 60, durationMinutes: 7 * 60, createdAt },
    { id: "c6", title: "Study group", kind: "personal", dayOfWeek: 5, startMinutes: 16 * 60, durationMinutes: 60, createdAt },
  ];
}

/** The one `UserPreferences` row, seeded once with the same reasonable
 *  defaults that used to be hardcoded constants (`domain/plan`'s old
 *  `WAKING_START_HOUR`/`WAKING_END_HOUR`, `STUDY_SESSION_SECONDS`) — real,
 *  editable Settings state from that point forward. Quiet hours start unset:
 *  asserting a bedtime cutoff nobody chose would be the same fabricated-
 *  default mistake `Habit.cadence` avoided. */
export function createDefaultPreferences(): UserPreferences {
  return { id: "singleton", wakingStartHour: 7, wakingEndHour: 23, sessionLengthMinutes: 45 };
}

/**
 * Present-state demo habit *definitions* — seeded once by `HabitProvider` on
 * a genuinely first-ever run, exactly like `createSeedTasks`/
 * `createSeedSubjects`, then real, editable, archivable state from that
 * point forward. This is definition-only content (name, cadence, icon), not
 * fabricated history — no `HabitLog` is ever seeded alongside these, so a
 * new user's actual completion record starts genuinely empty regardless of
 * how many demo habits exist (PRODUCT_BLUEPRINT.md §18.1's fabrication
 * rule). Cadences are a deliberate, reasonable default per habit, not
 * arbitrary: Sleep/Water/No-screen are every-day habits; Exercise/Reading
 * are realistic few-times-a-week ones.
 */
export function createSeedHabits(now: Date): Habit[] {
  const createdAt = atDaysFromNow(now, -14, 9, 0);
  return [
    { id: "h1", label: "Sleep", cadence: { type: "daily" }, iconKey: "sleep", color: "primary", createdAt },
    { id: "h2", label: "Exercise", cadence: { type: "times_per_week", target: 3 }, iconKey: "exercise", color: "orange", createdAt },
    { id: "h3", label: "Water", cadence: { type: "daily" }, iconKey: "water", color: "blue", createdAt },
    { id: "h4", label: "Reading", cadence: { type: "times_per_week", target: 3 }, iconKey: "reading", color: "teal", createdAt },
    { id: "h5", label: "No screen before bed", cadence: { type: "daily" }, iconKey: "screen_free", color: "green", createdAt },
  ];
}

/** Product concepts, not working actions — see AiPreviewCard/FloatingAiButton.
 *  Shared so the desktop and mobile "coming soon" surfaces stay in sync. */
export const AI_FUTURE_ACTIONS: string[] = [
  "Plan my day",
  "Plan my afternoon",
  "What should I do next?",
  "Review my week",
];
