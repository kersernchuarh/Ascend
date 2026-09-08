import { formatDuration } from "@/lib/format-date";
import type { EstimateAccuracy } from "@/domain/progress";

/** Answers: "am I any good at estimating how long my work takes?" — the
 *  student's own defining cognitive bias (blueprint §2). `null` until at
 *  least one completed, estimated deliverable has real logged time behind
 *  it, which is the honest state for most of a term. */
function EstimateAccuracyNote({ accuracy }: { accuracy: EstimateAccuracy | null }) {
  if (!accuracy) {
    return (
      <p className="py-4 text-center text-caption text-muted-foreground">
        Not enough data yet — complete a deliverable you logged Focus Session time against to see this
      </p>
    );
  }

  const pct = Math.round(accuracy.ratio * 100);
  const summary = pct === 100 ? "spot on, on average" : pct > 100 ? `${pct - 100}% over, on average` : `${100 - pct}% under, on average`;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-body text-foreground">
        Across {accuracy.sampleSize} completed deliverable{accuracy.sampleSize === 1 ? "" : "s"}, your estimates ran{" "}
        <span className="font-medium">{summary}</span>
      </p>
      <p className="text-caption text-muted-foreground">
        {formatDuration(accuracy.estimatedMinutes)} estimated vs {formatDuration(accuracy.actualMinutes)} actual
      </p>
    </div>
  );
}

export { EstimateAccuracyNote };
