"use client";

import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { PILLARS } from "@/lib/pillars";
import { cn } from "@/lib/utils";
import { formatRelativeDay } from "@/lib/format-date";
import { deadlineRisk, sortByIsoDate } from "@/domain/time";
import { useNow } from "@/domain/use-now";
import { useDeliverables } from "@/state/deliverable-context";
import type { Deliverable } from "@/domain/types";

function EmptyUpcoming() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <CalendarCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-body text-muted-foreground">Nothing on your radar</p>
    </div>
  );
}

function DeliverableRow({ deliverable, now }: { deliverable: Deliverable; now: Date }) {
  const pillar = PILLARS[deliverable.pillar];
  const Icon = pillar.icon;
  // Urgency is derived from the real due date every render, never a
  // hand-authored flag — see `domain/time.deadlineRisk`.
  const risk = deadlineRisk(deliverable.dueAt, now);
  const isUrgent = risk !== "on-track";
  const label = formatRelativeDay(deliverable.dueAt, now);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
          ACCENT_CHIP_CLASSES[pillar.color]
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <p className="flex-1 truncate text-body font-medium text-foreground">
        {deliverable.title}
      </p>
      {isUrgent ? (
        <PillBadge color="red">{label}</PillBadge>
      ) : (
        <span className="shrink-0 text-caption text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

function UpcomingCard() {
  const now = useNow();
  const { deliverables, status } = useDeliverables();

  // Real, shared `DeliverableProvider` state — the same records Work reads
  // and edits (PRODUCT_BLUEPRINT.md §7.2). Submitted deliverables drop off
  // once completed; the rest are soonest-due first.
  const upcoming = useMemo(() => {
    const outstanding = deliverables.filter((d) => d.completedAt == null);
    return sortByIsoDate(outstanding, (d) => d.dueAt);
  }, [deliverables]);

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader title="Upcoming" description="Deadlines on your radar" />
        {status === "loading" ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ) : upcoming.length > 0 && now ? (
          <div className="mt-4">
            {upcoming.map((deliverable) => (
              <DeliverableRow key={deliverable.id} deliverable={deliverable} now={now} />
            ))}
          </div>
        ) : (
          <EmptyUpcoming />
        )}
      </CardContent>
    </Card>
  );
}

export { UpcomingCard };
