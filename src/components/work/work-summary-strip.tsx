import { AlertTriangle, CalendarClock, ListTodo } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import type { WorkSummary } from "@/domain/work";

/** Three real, derived counts — no percentage, no "productivity score".
 *  See `domain/work.workSummary` for exactly what each counts. */
function WorkSummaryStrip({ summary }: { summary: WorkSummary }) {
  return (
    <section aria-label="Work summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard label="Overdue" value={`${summary.overdue}`} icon={AlertTriangle} color="red" />
      <MetricCard label="Due this week" value={`${summary.dueThisWeek}`} icon={CalendarClock} color="orange" />
      <MetricCard label="Remaining" value={`${summary.remaining}`} icon={ListTodo} color="primary" />
    </section>
  );
}

export { WorkSummaryStrip };
