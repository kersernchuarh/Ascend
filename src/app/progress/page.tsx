"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Link as LinkIcon, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/shared/metric-card";
import { WeekInReviewStrip } from "@/components/progress/week-in-review-strip";
import { WorkloadByPillarBars } from "@/components/progress/workload-by-pillar-bars";
import { EstimateAccuracyNote } from "@/components/progress/estimate-accuracy-note";
import { AtRiskList } from "@/components/plan/at-risk-list";
import { HabitCard } from "@/components/habits/habit-card";
import { useDeliverables } from "@/state/deliverable-context";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useHabits } from "@/state/habit-context";
import { useNow } from "@/domain/use-now";
import { createSeedCalendarEvents } from "@/data/dashboard";
import { atRiskDeliverables } from "@/domain/plan";
import { estimateAccuracy, weekInReview, weeklyFocusHabitJuxtaposition, workloadByPillar } from "@/domain/progress";
import { workSummary } from "@/domain/work";
import { formatDuration } from "@/lib/format-date";

/**
 * Progress: "how am I actually doing?" — not a generic analytics dashboard.
 * Four sections, each answering one real question over data the app
 * already has; nothing here is fabricated or shown before it's supported
 * (PRODUCT_BLUEPRINT.md's Habits + Progress phase, §13). Reuses Work's
 * `workSummary` and Plan's `workloadRisk`/`AtRiskList` rather than
 * recomputing either.
 */
export default function ProgressPage() {
  const { deliverables, status: deliverableStatus } = useDeliverables();
  const { tasks, status: taskStatus } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { habits, logs, status: habitStatus, isCompletedToday, toggleHabitToday, toggleHabitOnDate, updateHabit, setHabitArchived } =
    useHabits();
  const now = useNow();

  const ready =
    deliverableStatus === "ready" &&
    taskStatus === "ready" &&
    sessionStatus === "ready" &&
    habitStatus === "ready" &&
    now != null;

  const events = useMemo(() => (now ? createSeedCalendarEvents(now) : []), [now]);
  const review = useMemo(() => (now ? weekInReview(sessions, tasks, now) : null), [sessions, tasks, now]);
  const summary = useMemo(() => (now ? workSummary(tasks, deliverables, now) : null), [tasks, deliverables, now]);
  const atRisk = useMemo(
    () => (now ? atRiskDeliverables(deliverables, tasks, sessions, events, now) : []),
    [deliverables, tasks, sessions, events, now]
  );
  const pillarWorkload = useMemo(() => workloadByPillar(tasks, deliverables), [tasks, deliverables]);
  const accuracy = useMemo(() => estimateAccuracy(deliverables, tasks, sessions), [deliverables, tasks, sessions]);
  const juxtaposition = useMemo(
    () => (now ? weeklyFocusHabitJuxtaposition(sessions, logs, now) : null),
    [sessions, logs, now]
  );
  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archivedAt), [habits]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader level={2} title="This week" description="What actually happened, from real records" />
          {!ready || !review ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
              <Skeleton className="h-24 w-full rounded-card" />
              <Skeleton className="h-24 w-full rounded-card" />
              <Skeleton className="h-24 w-full rounded-card" />
            </div>
          ) : (
            <WeekInReviewStrip review={review} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Workload" description="What's outstanding, and where the risk actually is" />
          {!ready || !summary ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-16 w-full rounded-[10px]" />
              <Skeleton className="h-16 w-full rounded-[10px]" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Overdue" value={`${summary.overdue}`} icon={AlertTriangle} color="red" />
                <MetricCard label="Remaining" value={`${summary.remaining}`} icon={ListTodo} color="primary" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-h3 text-foreground">At risk</h3>
                <AtRiskList deliverables={atRisk} tasks={tasks} sessions={sessions} events={events} now={now ?? new Date()} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-h3 text-foreground">Remaining work by pillar</h3>
                <WorkloadByPillarBars data={pillarWorkload} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            title="Habits"
            description="Your consistency this week"
            action={
              <Link href="/habits" className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
                <LinkIcon className="size-3.5" />
                Manage
              </Link>
            }
          />
          {!ready ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-24 w-full rounded-[10px]" />
              <Skeleton className="h-24 w-full rounded-[10px]" />
            </div>
          ) : activeHabits.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">
              No habits yet — add one on the Habits page to start tracking consistency
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  logs={logs}
                  now={now ?? new Date()}
                  completedToday={isCompletedToday(habit.id)}
                  onToggleToday={() => toggleHabitToday(habit.id)}
                  onToggleDate={(date) => toggleHabitOnDate(habit.id, date)}
                  onUpdate={(input) => updateHabit(habit.id, input)}
                  onSetArchived={(archived) => setHabitArchived(habit.id, archived)}
                />
              ))}
            </div>
          )}
          {ready && juxtaposition ? (
            <p className="text-caption text-muted-foreground">
              This week you focused for {formatDuration(juxtaposition.focusedMinutes)} and logged habits on{" "}
              {juxtaposition.habitDaysLogged} of 7 days.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Estimate accuracy" description="Are your time estimates actually right?" />
          {!ready ? (
            <Skeleton className="h-16 w-full rounded-[10px]" aria-hidden="true" />
          ) : (
            <EstimateAccuracyNote accuracy={accuracy} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
