import {
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  MonitorOff,
  Repeat,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { AccentColor } from "./colors";

export type HabitIconKey =
  | "sleep"
  | "exercise"
  | "water"
  | "reading"
  | "screen_free"
  | "strength"
  | "mindfulness"
  | "wellness"
  | "routine"
  | "general";

export type HabitIconOption = { key: HabitIconKey; icon: LucideIcon; color: AccentColor; label: string };

/** A small, fixed icon+color palette for habit creation/editing — paired as
 *  one unit (not two separate pickers) since a habit's visual identity is a
 *  single choice, not independent icon and color decisions. */
export const HABIT_ICON_OPTIONS: HabitIconOption[] = [
  { key: "sleep", icon: Moon, color: "primary", label: "Sleep" },
  { key: "exercise", icon: Flame, color: "orange", label: "Exercise" },
  { key: "water", icon: Droplets, color: "blue", label: "Water" },
  { key: "reading", icon: BookOpen, color: "teal", label: "Reading" },
  { key: "screen_free", icon: MonitorOff, color: "green", label: "Screen-free" },
  { key: "strength", icon: Dumbbell, color: "red", label: "Strength" },
  { key: "mindfulness", icon: Brain, color: "primary", label: "Mindfulness" },
  { key: "wellness", icon: Heart, color: "red", label: "Wellness" },
  { key: "routine", icon: Sun, color: "orange", label: "Routine" },
  { key: "general", icon: Repeat, color: "primary", label: "General" },
];

/**
 * Resolves a persisted `HabitIconKey` back to its real component, by plain
 * object lookup (`HABIT_ICON_MAP[habit.iconKey]`) — the same shape as
 * `PILLARS[pillar].icon` elsewhere in this codebase, deliberately not a
 * function call: React's static-components check wants an icon resolved
 * at render time to look like a stable reference lookup, not something
 * that could construct a new value each call. `Habit` stores only the key,
 * never a component reference directly, because a `LucideIcon` isn't
 * JSON-serializable — a component stored in state and round-tripped
 * through `localStorage` (`JSON.stringify` then `JSON.parse` on the next
 * load) comes back as an empty object, not a renderable component, which
 * is the exact bug live browser testing caught here.
 */
export const HABIT_ICON_MAP: Record<HabitIconKey, LucideIcon> = Object.fromEntries(
  HABIT_ICON_OPTIONS.map((option) => [option.key, option.icon])
) as Record<HabitIconKey, LucideIcon>;
