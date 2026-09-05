"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { createSeedCalendarEvents } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { addDays, isSameDay, startOfWeek } from "@/domain/time";
import { formatWeekdayShort } from "@/lib/format-date";
import { cn } from "@/lib/utils";

/** Mobile-only orientation strip — real days of the actual current week
 *  with real per-day event counts from seed `CalendarEvent[]`. Doesn't map
 *  onto a specific tier of the Today/Deadlines/Progress hierarchy; it's a
 *  lightweight "what week is this" aid, kept small and placed accordingly. */
function WeekStripCard() {
  const now = useNow();

  const weekDays = useMemo(() => {
    if (!now) return [];
    const events = createSeedCalendarEvents(now);
    const monday = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return {
        date,
        isToday: isSameDay(date, now),
        eventCount: events.filter((event) => isSameDay(new Date(event.startAt), date)).length,
      };
    });
  }, [now]);

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader title="This week" />
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day.date.toISOString()}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[10px] py-2",
                day.isToday ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
              )}
            >
              <span
                className={cn(
                  "text-caption",
                  day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {formatWeekdayShort(day.date)}
              </span>
              <span className="text-body">{day.date.getDate()}</span>
              <span
                className={cn(
                  "size-1 rounded-full",
                  day.eventCount > 0
                    ? day.isToday
                      ? "bg-primary-foreground"
                      : "bg-primary"
                    : "bg-transparent"
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { WeekStripCard };
