"use client";

import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import { useTasks } from "@/state/task-context";

function TodaysFocusCard() {
  const { todayTasks: tasks, completedCount, toggleTask } = useTasks();

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader
          title="Today's Focus"
          description={`${completedCount}/${tasks.length} completed`}
        />
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <ClipboardCheck className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">
              Nothing on your plate today
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {tasks.map((task) => {
              const pillar = PILLARS[task.pillar];
              const Icon = pillar.icon;

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 border-b border-border py-3 last:border-0"
                >
                  <Checkbox
                    checked={!!task.completedAt}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-[3px] shrink-0"
                  />
                  {/* Title sits on its own line above the pillar/time meta row: in the
                      three-column grid the card is too narrow to fit all three inline
                      without truncating the title down to a few characters. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      className={cn(
                        "text-body transition-colors duration-200",
                        task.completedAt
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <PillBadge color={pillar.color}>
                        <Icon className="size-3" />
                        {pillar.label}
                      </PillBadge>
                      {task.scheduledFor ? (
                        <span className="text-caption text-muted-foreground">
                          {formatTime(task.scheduledFor)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TodaysFocusCard };
