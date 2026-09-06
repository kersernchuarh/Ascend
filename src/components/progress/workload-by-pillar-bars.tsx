import { cn } from "@/lib/utils";
import { ACCENT_SOLID_CLASSES } from "@/lib/colors";
import { formatDuration } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import type { PillarWorkload } from "@/domain/progress";

/** Answers: "where is my remaining estimated work actually concentrated?"
 *  Real minutes, sorted heaviest first — never a percentage of an
 *  undefined whole. */
function WorkloadByPillarBars({ data }: { data: PillarWorkload[] }) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-caption text-muted-foreground">
        No estimated work outstanding right now
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.remainingMinutes));

  return (
    <div className="flex flex-col gap-2">
      {data.map(({ pillar, remainingMinutes }) => {
        const info = PILLARS[pillar];
        const Icon = info.icon;
        const widthPct = Math.max(4, Math.round((remainingMinutes / max) * 100));
        return (
          <div key={pillar} className="flex items-center gap-2">
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="w-24 shrink-0 truncate text-caption text-muted-foreground">{info.label}</span>
            <div className="h-2 flex-1 rounded-full bg-surface-2">
              <div className={cn("h-2 rounded-full", ACCENT_SOLID_CLASSES[info.color])} style={{ width: `${widthPct}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-caption text-muted-foreground">
              {formatDuration(remainingMinutes)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { WorkloadByPillarBars };
