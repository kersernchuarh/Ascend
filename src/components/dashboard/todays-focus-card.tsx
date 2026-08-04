"use client";

import * as React from "react";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { PillBadge } from "@/components/shared/pill-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PILLARS } from "@/lib/pillars";
import { TODAY_TASKS, type DashboardTask } from "@/data/dashboard";

function TodaysFocusCard() {
  const [tasks, setTasks] = React.useState<DashboardTask[]>(TODAY_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  };

  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <Card className="w-full">
      <CardContent>
        <SectionHeader
          title="Today's Focus"
          description={`${doneCount}/${tasks.length} completed`}
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
                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <span
                    className={cn(
                      "flex-1 truncate text-body transition-colors duration-200",
                      task.done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  <PillBadge color={pillar.color}>
                    <Icon className="size-3" />
                    {pillar.label}
                  </PillBadge>
                  {task.time ? (
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {task.time}
                    </span>
                  ) : null}
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
