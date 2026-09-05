"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import { useDeliverables } from "@/state/deliverable-context";
import { endOfDay, fromIsoDateLocal } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";
import type { Task } from "@/domain/types";

type CreateTaskFormProps = {
  onCreate: (input: Omit<Task, "id" | "createdAt">) => void;
  /** Preselects a deliverable and hides the picker — used when this form is
   *  rendered inline under one specific deliverable's expanded row. */
  fixedDeliverableId?: string;
};

/**
 * Work's richer quick-add: same fast title-only path as Home's `AddTaskRow`,
 * but with deliverable/due date/estimate available behind "More" — the
 * fields Work's own tasks actually need (Step 5's progressive disclosure).
 */
function CreateTaskForm({ onCreate, fixedDeliverableId }: CreateTaskFormProps) {
  const { deliverables } = useDeliverables();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [deliverableId, setDeliverableId] = useState(fixedDeliverableId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("");
  const [pillar, setPillar] = useState<PillarId>("academics");

  function reset() {
    setTitle("");
    setDueDate("");
    setEstimate("");
    setPillar("academics");
    if (!fixedDeliverableId) setDeliverableId("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate({
      title: trimmed,
      pillar,
      deliverableId: deliverableId || undefined,
      dueAt: dueDate ? endOfDay(fromIsoDateLocal(dueDate)).toISOString() : undefined,
      estimateMinutes: estimate ? Number(estimate) : undefined,
    });
    reset();
  }

  const openDeliverables = deliverables.filter((deliverable) => deliverable.completedAt == null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task..."
          aria-label="New task title"
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Add task" disabled={title.trim().length === 0}>
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          More
        </Button>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-3 rounded-[10px] border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            {!fixedDeliverableId ? (
              <>
                <label className="text-caption text-muted-foreground" htmlFor="task-deliverable">
                  Deliverable
                </label>
                <select
                  id="task-deliverable"
                  value={deliverableId}
                  onChange={(event) => setDeliverableId(event.target.value)}
                  className="h-8 rounded-input border border-input bg-transparent px-2 text-sm text-foreground"
                >
                  <option value="">No deliverable</option>
                  {openDeliverables.map((deliverable) => (
                    <option key={deliverable.id} value={deliverable.id}>
                      {deliverable.title}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <label className="text-caption text-muted-foreground" htmlFor="task-due">
              Due
            </label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-[150px]"
            />
            <label className="text-caption text-muted-foreground" htmlFor="task-estimate">
              Estimate (min)
            </label>
            <Input
              id="task-estimate"
              type="number"
              min={0}
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              className="w-20"
            />
          </div>
          <PillarPicker value={pillar} onChange={setPillar} label="Pillar for new task" />
        </div>
      ) : null}
    </form>
  );
}

export { CreateTaskForm };
