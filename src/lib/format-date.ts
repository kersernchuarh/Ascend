import { daysUntilDue } from "@/domain/time";

/**
 * DISPLAY DATA only — every function here turns a real domain value (an ISO
 * string, a count of minutes) into the label the UI shows. Nothing in
 * `@/domain` or `@/data` should ever store the output of these functions;
 * they are computed fresh at render time, always from a real value and a
 * real `now` (see PRODUCT_BLUEPRINT.md's "Separate DOMAIN DATA from DISPLAY
 * DATA" rule).
 */

/** "Today" / "Tomorrow" / "Yesterday" / "In 3 days" / "5 days ago", falling
 *  back to a calendar date once far enough away that a relative label stops
 *  being useful. */
export function formatRelativeDay(iso: string, now: Date): string {
  const days = daysUntilDue(iso, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days <= 6) return `In ${days} days`;
  if (days < -1 && days >= -6) return `${Math.abs(days)} days ago`;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/** "9:00 AM" — the time-of-day portion of an ISO datetime. */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "Mon" / "Tue" / ... — the short weekday label for a calendar-strip cell. */
export function formatWeekdayShort(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

/** "45 min" / "1h" / "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
