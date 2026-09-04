"use client";

import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { PILLARS } from "@/lib/pillars";
import { cn } from "@/lib/utils";
import { formatRelativeDay } from "@/lib/format-date";
import { deadlineRisk } from "@/domain/time";
import { useNow } from "@/domain/use-now";
import { createSeedDeadlines } from "@/data/dashboard";
import type { Deadline } from "@/domain/types";

function EmptyUpcoming() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <CalendarCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-body text-muted-foreground">Nothing on your radar</p>
    </div>
  );
}

function DeadlineRow({ deadline, now }: { deadline: Deadline; now: Date }) {
  const pillar = PILLARS[deadline.pillar];
  const Icon = pillar.icon;
  // Urgency is derived from the real due date every render, never a
  // hand-authored flag — see `domain/time.deadlineRisk`.
  const risk = deadlineRisk(deadline.dueAt, now);
  const isUrgent = risk !== "on-track";
  const label = formatRelativeDay(deadline.dueAt, now);

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
        {deadline.title}
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
  // Empty until real "now" is available (see `useNow`) — the alternative
  // would be guessing relative dates at build time, which is wrong the
  // moment the calendar turns over.
  const deadlines = useMemo(() => (now ? createSeedDeadlines(now) : []), [now]);

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader title="Upcoming" description="Deadlines on your radar" />
        {deadlines.length > 0 && now ? (
          <div className="mt-4">
            {deadlines.map((deadline) => (
              <DeadlineRow key={deadline.id} deadline={deadline} now={now} />
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
