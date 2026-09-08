"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/state/task-context";
import { useDeliverables } from "@/state/deliverable-context";
import { useSessions } from "@/state/session-context";
import { useCalendarEvents } from "@/state/calendar-event-context";
import { usePreferences } from "@/state/preferences-context";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { calendarEventOccurrenceOn, dayHasConflict, workloadRisk } from "@/domain/plan";
import { dueTodayHabits } from "@/domain/metrics";
import { MOCK_USER } from "@/data/mock";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type Signal = {
  text: string;
  href?: string;
  icon: typeof AlertTriangle;
  tone: "attention" | "neutral" | "setup";
};

/**
 * Orientation, not a hero. Answers "who/where am I, what day is it, does
 * anything need my attention" in one small line — never the dominant
 * element on the page (PRODUCT_BLUEPRINT.md §9.2's "the greeting shrinks...
 * it is not worth h1" carried further: even the derived state line below it
 * stays caption-sized). The one derived phrase is a state machine over real
 * data, prioritized by what's actually most consequential right now — never
 * more than one line, and never a raw number doing duty as a headline.
 */
function HomeHeader() {
  const [greeting, setGreeting] = useState("Good day");
  const { tasks, todayTasks, status: taskStatus } = useTasks();
  const { deliverables, status: deliverableStatus } = useDeliverables();
  const { sessions, status: sessionStatus } = useSessions();
  const { events, status: eventStatus } = useCalendarEvents();
  const { preferences, status: prefsStatus } = usePreferences();
  const { habits, status: habitStatus } = useHabits();
  const now = useNow();

  useEffect(() => {
    // Unknowable during SSR — an intentional exception to the lint rule
    // below, matching the established `useNow`/hydration pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  const ready =
    taskStatus === "ready" &&
    deliverableStatus === "ready" &&
    sessionStatus === "ready" &&
    eventStatus === "ready" &&
    prefsStatus === "ready" &&
    habitStatus === "ready" &&
    now != null;

  const signal = useMemo<Signal | null>(() => {
    if (!ready || !now) return null;

    const outstanding = deliverables.filter((d) => d.completedAt == null);
    const overdueCount = outstanding.filter(
      (d) => workloadRisk(d, tasks, sessions, events, now, preferences) === "overdue"
    ).length;
    if (overdueCount > 0) {
      return {
        text: overdueCount === 1 ? "You have one overdue item" : `You have ${overdueCount} overdue items`,
        href: "#attention",
        icon: AlertTriangle,
        tone: "attention",
      };
    }

    const atRiskCount = outstanding.filter((d) => {
      const risk = workloadRisk(d, tasks, sessions, events, now, preferences);
      return risk === "tight" || risk === "insufficient-time";
    }).length;
    if (atRiskCount > 0) {
      return {
        text:
          atRiskCount === 1
            ? "One deliverable needs attention"
            : `${atRiskCount} deliverables need attention`,
        href: "#attention",
        icon: AlertTriangle,
        tone: "attention",
      };
    }

    if (dayHasConflict(now, events, tasks)) {
      return { text: "Your schedule overlaps today", href: "#schedule", icon: CalendarClock, tone: "attention" };
    }

    const isBrandNew = tasks.length === 0 && deliverables.length === 0 && habits.length === 0;
    if (isBrandNew) {
      return {
        text: "Add your first task to get started",
        href: "/work",
        icon: Sparkles,
        tone: "setup",
      };
    }

    const eventsToday = events.filter((event) => calendarEventOccurrenceOn(event, now) != null).length;
    const dueTodayCount = dueTodayHabits(habits, now).length;
    const nothingToday = eventsToday === 0 && todayTasks.length === 0 && dueTodayCount === 0;
    if (nothingToday) {
      return { text: "A clear day — good time to plan ahead", icon: Sparkles, tone: "neutral" };
    }

    return { text: "Here's how today looks", icon: Sparkles, tone: "neutral" };
  }, [ready, now, deliverables, tasks, todayTasks, sessions, events, preferences, habits]);

  const dateLabel = now
    ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now)
    : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption text-muted-foreground">
        {greeting}, {MOCK_USER.name}
        {dateLabel ? ` · ${dateLabel}` : ""}
      </p>
      {!ready || !signal ? (
        <Skeleton className="h-5 w-56 rounded-[6px]" />
      ) : (
        <SignalLine signal={signal} />
      )}
    </div>
  );
}

function SignalLine({ signal }: { signal: Signal }) {
  const Icon = signal.icon;
  const content = (
    <span
      className={
        "inline-flex items-center gap-1.5 text-body font-medium " +
        (signal.tone === "attention" ? "text-orange" : "text-foreground")
      }
    >
      <Icon className="size-4 shrink-0" />
      {signal.text}
    </span>
  );
  return signal.href ? (
    <Link href={signal.href} className="w-fit transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export { HomeHeader };
