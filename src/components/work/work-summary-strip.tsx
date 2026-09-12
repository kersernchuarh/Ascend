import { AlertTriangle, CalendarClock, ListTodo } from "lucide-react";
import type { WorkSummary } from "@/domain/work";

/** Three real, derived counts — no percentage, no "productivity score".
 *  A single compact row (PRODUCT_BLUEPRINT.md §32), not three full-size
 *  cards: these are orientation, not the point of the page — the Subjects
 *  list below is. See `domain/work.workSummary` for exactly what each
 *  counts. */
function WorkSummaryStrip({ summary }: { summary: WorkSummary }) {
  return (
    <section aria-label="Work summary" className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-caption">
      <span className={"flex items-center gap-1.5 " + (summary.overdue > 0 ? "text-red" : "text-muted-foreground")}>
        <AlertTriangle className="size-3.5" />
        <span className="font-medium text-foreground">{summary.overdue}</span> overdue
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarClock className="size-3.5" />
        <span className="font-medium text-foreground">{summary.dueThisWeek}</span> due this week
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <ListTodo className="size-3.5" />
        <span className="font-medium text-foreground">{summary.remaining}</span> remaining
      </span>
    </section>
  );
}

export { WorkSummaryStrip };
