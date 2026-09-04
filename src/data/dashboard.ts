import {
  BookOpen,
  Droplets,
  Flame,
  Moon,
  MonitorOff,
  type LucideIcon,
} from "lucide-react";
import type { PillarId } from "@/lib/pillars";
import type { AccentColor } from "@/lib/colors";

export type DashboardTask = {
  id: string;
  title: string;
  pillar: PillarId;
  time?: string;
  done: boolean;
};

export type Deadline = {
  id: string;
  title: string;
  pillar: PillarId;
  dueLabel: string;
  urgent?: boolean;
};

export type BalanceEntry = {
  pillar: PillarId;
  score: number;
};

export type HabitEntry = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  color: AccentColor;
};

export type AiInsight = {
  message: string;
  recommendation: string;
};

export type CalendarPreviewDay = {
  label: string;
  date: number;
  isToday?: boolean;
  eventCount: number;
};

export const TODAY_TASKS: DashboardTask[] = [
  { id: "t1", title: "Finish calculus problem set", pillar: "academics", time: "9:00 AM", done: true },
  { id: "t2", title: "Meditate 10 minutes", pillar: "mind", time: "8:30 AM", done: true },
  { id: "t3", title: "30 minute run", pillar: "health", time: "5:30 PM", done: false },
  { id: "t4", title: "Review Spanish flashcards", pillar: "academics", time: "7:00 PM", done: false },
  { id: "t5", title: "Call mom", pillar: "life", time: "8:00 PM", done: false },
];

export const UPCOMING_DEADLINES: Deadline[] = [
  { id: "d1", title: "Chemistry lab report", pillar: "academics", dueLabel: "Tomorrow", urgent: true },
  { id: "d2", title: "History essay draft", pillar: "academics", dueLabel: "In 3 days" },
  { id: "d3", title: "Club meeting prep", pillar: "productivity", dueLabel: "In 5 days" },
  { id: "d4", title: "Dentist appointment", pillar: "health", dueLabel: "Next week" },
];

/** Order matches PILLAR_LIST — six core pillars, one score each (0-100). */
export const WEEKLY_BALANCE: BalanceEntry[] = [
  { pillar: "academics", score: 82 },
  { pillar: "health", score: 64 },
  { pillar: "mind", score: 58 },
  { pillar: "growth", score: 70 },
  { pillar: "life", score: 45 },
  { pillar: "productivity", score: 76 },
];

export const HABITS: HabitEntry[] = [
  { id: "h1", label: "Sleep", value: 82, icon: Moon, color: "primary" },
  { id: "h2", label: "Exercise", value: 60, icon: Flame, color: "orange" },
  { id: "h3", label: "Water", value: 45, icon: Droplets, color: "blue" },
  { id: "h4", label: "Reading", value: 70, icon: BookOpen, color: "teal" },
  { id: "h5", label: "No screen before bed", value: 55, icon: MonitorOff, color: "green" },
];

/** Simple average of the six pillar scores — the single source of truth for
 *  the "life balance" number shown in both the donut center and mobile hero. */
export const OVERALL_BALANCE_SCORE = Math.round(
  WEEKLY_BALANCE.reduce((sum, entry) => sum + entry.score, 0) / WEEKLY_BALANCE.length
);

export const CALENDAR_PREVIEW: CalendarPreviewDay[] = [
  { label: "Mon", date: 3, eventCount: 1 },
  { label: "Tue", date: 4, eventCount: 0 },
  { label: "Wed", date: 5, isToday: true, eventCount: 3 },
  { label: "Thu", date: 6, eventCount: 1 },
  { label: "Fri", date: 7, eventCount: 2 },
  { label: "Sat", date: 8, eventCount: 0 },
  { label: "Sun", date: 9, eventCount: 0 },
];

export const AI_INSIGHT: AiInsight = {
  message:
    "You've been studying consistently. Your productivity is 18% higher than last week.",
  recommendation:
    "Consider a 10-minute walk after lunch — your focus tends to dip around 2 PM.",
};

export const AI_QUICK_ACTIONS: string[] = [
  "Plan my week",
  "Generate revision timetable",
  "Summarize homework",
  "How can I improve?",
];

export const STUDY_SESSION_SECONDS = 45 * 60;
