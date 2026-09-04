import { BookOpen, Droplets, Flame, Moon, MonitorOff } from "lucide-react";
import type {
  Task,
  Deadline,
  CalendarEvent,
  Habit,
  HabitLog,
} from "@/domain/types";
import { addDays, endOfDay, startOfDay, startOfWeek } from "@/domain/time";

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
    },
    {
      id: "t2",
      title: "Meditate 10 minutes",
      pillar: "mind",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 8, 30),
      completedAt: atToday(now, 8, 40),
    },
    {
      id: "t3",
      title: "30 minute run",
      pillar: "health",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 17, 30),
    },
    {
      id: "t4",
      title: "Review Spanish flashcards",
      pillar: "academics",
      createdAt: atDaysFromNow(now, -1, 18, 0),
      scheduledFor: atToday(now, 19, 0),
    },
    {
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
  ];
}

export function createSeedDeadlines(now: Date): Deadline[] {
  // All day-granularity: nobody specified an exact submission minute for any
  // of these, so `dueAt` is anchored to end-of-day rather than inventing one.
  const dueInDays = (days: number) => endOfDay(addDays(now, days)).toISOString();
  return [
    {
      id: "d1",
      title: "Chemistry lab report",
      pillar: "academics",
      dueAt: dueInDays(1),
      allDay: true,
      createdAt: atDaysFromNow(now, -3, 9, 0),
    },
    {
      id: "d2",
      title: "History essay draft",
      pillar: "academics",
      dueAt: dueInDays(3),
      allDay: true,
      createdAt: atDaysFromNow(now, -5, 9, 0),
    },
    {
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

export function createSeedCalendarEvents(now: Date): CalendarEvent[] {
  const monday = startOfWeek(now);
  const at = (dayOffset: number, hours: number, minutes: number): string => {
    const d = addDays(monday, dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "c1", title: "Morning classes", startAt: at(0, 8, 0), endAt: at(0, 15, 0) },
    { id: "c2", title: "Chemistry practical", startAt: at(2, 8, 0), endAt: at(2, 10, 0) },
    { id: "c3", title: "Debate club", startAt: at(2, 16, 0), endAt: at(2, 17, 30) },
    { id: "c4", title: "Morning classes", startAt: at(3, 8, 0), endAt: at(3, 15, 0) },
    { id: "c5", title: "Morning classes", startAt: at(4, 8, 0), endAt: at(4, 15, 0) },
    { id: "c6", title: "Study group", startAt: at(4, 16, 0), endAt: at(4, 17, 0) },
  ];
}

/** Static habit definitions — no time dependency, unlike their logs. */
export const SEED_HABITS: Habit[] = [
  { id: "h1", label: "Sleep", icon: Moon, color: "primary" },
  { id: "h2", label: "Exercise", icon: Flame, color: "orange" },
  { id: "h3", label: "Water", icon: Droplets, color: "blue" },
  { id: "h4", label: "Reading", icon: BookOpen, color: "teal" },
  { id: "h5", label: "No screen before bed", icon: MonitorOff, color: "green" },
];

/** One dated log per habit, for today. Still seeded/mock values — the fix
 *  here is that every value is now tied to a real date instead of floating
 *  with no period attached; deriving a genuinely earned percentage needs
 *  accumulated real history and real logging UI, which is Phase 7's job
 *  (PRODUCT_BLUEPRINT.md §12, §25). */
export function createSeedHabitLogs(now: Date): HabitLog[] {
  const today = startOfDay(now).toISOString().slice(0, 10);
  return [
    { id: "hl1", habitId: "h1", date: today, value: 82 },
    { id: "hl2", habitId: "h2", date: today, value: 60 },
    { id: "hl3", habitId: "h3", date: today, value: 45 },
    { id: "hl4", habitId: "h4", date: today, value: 70 },
    { id: "hl5", habitId: "h5", date: today, value: 55 },
  ];
}

/** Look up a habit's logged value for the day represented by `logs`. `undefined`
 *  means "not logged" — render that honestly rather than defaulting to 0. */
export function getHabitLogValue(
  logs: HabitLog[],
  habitId: string
): number | undefined {
  return logs.find((log) => log.habitId === habitId)?.value;
}

export const AI_QUICK_ACTIONS: string[] = [
  "Plan my week",
  "Generate revision timetable",
  "Summarize homework",
  "How can I improve?",
];

export const STUDY_SESSION_SECONDS = 45 * 60;
