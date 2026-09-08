import type { HabitCadence } from "@/domain/types";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** DISPLAY DATA — turns a real `HabitCadence` into the label the UI shows,
 *  the same "format at the edge" rule `lib/format-date.ts` follows for
 *  dates. Never stored, always derived at render time. */
export function formatCadence(cadence: HabitCadence): string {
  if (cadence.type === "daily") return "Every day";
  if (cadence.type === "days_of_week") {
    if (cadence.days.length === 0) return "No days set";
    if (cadence.days.length === 7) return "Every day";
    return [...cadence.days].sort((a, b) => a - b).map((d) => DAY_SHORT[d]).join(", ");
  }
  return `${cadence.target}x per week`;
}
