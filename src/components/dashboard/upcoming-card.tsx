import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { ACCENT_CHIP_CLASSES } from "@/lib/colors";
import { PILLARS } from "@/lib/pillars";
import { UPCOMING_DEADLINES } from "@/data/dashboard";
import { cn } from "@/lib/utils";

function EmptyUpcoming() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <CalendarCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-body text-muted-foreground">Nothing on your radar</p>
    </div>
  );
}

function DeadlineRow({ deadline }: { deadline: (typeof UPCOMING_DEADLINES)[number] }) {
  const pillar = PILLARS[deadline.pillar];
  const Icon = pillar.icon;

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
      {deadline.urgent ? (
        <PillBadge color="red">{deadline.dueLabel}</PillBadge>
      ) : (
        <span className="shrink-0 text-caption text-muted-foreground">
          {deadline.dueLabel}
        </span>
      )}
    </div>
  );
}

function UpcomingCard() {
  const hasDeadlines = UPCOMING_DEADLINES.length > 0;

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader title="Upcoming" description="Deadlines on your radar" />
        {hasDeadlines ? (
          <div className="mt-4">
            {UPCOMING_DEADLINES.map((deadline) => (
              <DeadlineRow key={deadline.id} deadline={deadline} />
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
