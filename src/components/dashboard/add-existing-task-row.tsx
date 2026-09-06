"use client";

import { useState } from "react";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { PILLARS } from "@/lib/pillars";
import type { Task } from "@/domain/types";

type AddExistingTaskRowProps = {
  /** Incomplete tasks not already scheduled for today — the Work backlog,
   *  filtered by the caller (`TodaysFocusCard`). */
  backlogTasks: Task[];
  onSchedule: (id: string) => void;
};

/**
 * Home's half of Home/Work synchronization (PRODUCT_BLUEPRINT.md §7.2 —
 * "Today... reads from everything"): lets a task created in Work join
 * Today's Focus without re-creating it. Collapsed by default and rendered
 * as nothing at all once the backlog is empty, so it never competes for
 * attention with the actual plan for today.
 */
function AddExistingTaskRow({ backlogTasks, onSchedule }: AddExistingTaskRowProps) {
  const [open, setOpen] = useState(false);

  if (backlogTasks.length === 0) return null;

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ListPlus className="size-3.5" />
        {open ? "Hide Work tasks" : `Add from Work (${backlogTasks.length})`}
      </Button>
      {open ? (
        <ul className="mt-2 flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-[10px] border border-border p-1.5">
          {backlogTasks.map((task) => {
            const pillar = PILLARS[task.pillar];
            const Icon = pillar.icon;
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onSchedule(task.id)}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-muted"
                >
                  <PillBadge color={pillar.color}>
                    <Icon className="size-3" />
                    {pillar.label}
                  </PillBadge>
                  <span className="truncate text-body text-foreground">{task.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export { AddExistingTaskRow };
