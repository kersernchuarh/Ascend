import { ClipboardList, Clock, Timer } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import type { WeekInReview } from "@/domain/progress";

type Trend = { direction: "up" | "down"; value: string; isPositive: boolean };

/** No trend for an exact tie — "+0" isn't a trend worth a badge. */
function trendFor(current: number, previous: number | undefined): Trend | undefined {
  if (previous == null) return undefined;
  const diff = current - previous;
  if (diff === 0) return undefined;
  return { direction: diff > 0 ? "up" : "down", value: `${diff > 0 ? "+" : ""}${diff}`, isPositive: diff > 0 };
}

/**
 * "This week" — three real figures, each with a real delta *only* when the
 * previous week actually has data (`review.previous` is `null` otherwise,
 * per `domain/progress.weekInReview`'s own rule). Never a fabricated
 * "18% higher than last week".
 */
function WeekInReviewStrip({ review }: { review: WeekInReview }) {
  const hasAnyDataThisWeek = review.sessionCount > 0 || review.tasksCompleted > 0;

  if (!hasAnyDataThisWeek && !review.previous) {
    return (
      <p className="py-6 text-center text-body text-muted-foreground">
        Not enough history yet — complete a task or run a Focus Session to start building this week.
      </p>
    );
  }

  return (
    <section aria-label="This week" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        label="Focus sessions"
        value={`${review.sessionCount}`}
        icon={Timer}
        color="primary"
        trend={trendFor(review.sessionCount, review.previous?.sessionCount)}
      />
      <MetricCard
        label="Focused minutes"
        value={`${review.focusedMinutes}`}
        unit="min"
        icon={Clock}
        color="blue"
        trend={trendFor(review.focusedMinutes, review.previous?.focusedMinutes)}
      />
      <MetricCard
        label="Tasks completed"
        value={`${review.tasksCompleted}`}
        icon={ClipboardList}
        color="green"
        trend={trendFor(review.tasksCompleted, review.previous?.tasksCompleted)}
      />
    </section>
  );
}

export { WeekInReviewStrip };
