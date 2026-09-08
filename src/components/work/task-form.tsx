"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import { useDeliverables } from "@/state/deliverable-context";
import { endOfDay, fromIsoDateLocal, toIsoDateLocal } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";
import type { Task } from "@/domain/types";

export type TaskFormInput = Omit<Task, "id" | "createdAt">;

type TaskFormProps = {
  /** Pass an existing task to edit it in place, pre-filled. */
  initialTask?: Task;
  onSubmit: (input: TaskFormInput) => void;
  onCancel?: () => void;
  /** Preselects a deliverable and hides the picker — used when this form is
   *  rendered inline under one specific deliverable's expanded row. */
  fixedDeliverableId?: string;
};

/**
 * Create and edit share one form, replacing `CreateTaskForm` (which only
 * ever created) — the same reasoning `plan/event-form.tsx` and
 * `work/deliverable-form.tsx` already apply. `scheduledFor` (Home's "today"
 * concept) is deliberately not editable here: it's a planning decision made
 * from Home/Plan, not a Work-level field a fast title-only form should touch.
 */
function TaskForm({ initialTask, onSubmit, onCancel, fixedDeliverableId }: TaskFormProps) {
  const { deliverables } = useDeliverables();
  const [expanded, setExpanded] = useState(!!initialTask);
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [deliverableId, setDeliverableId] = useState(
    initialTask?.deliverableId ?? fixedDeliverableId ?? ""
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueAt ? toIsoDateLocal(new Date(initialTask.dueAt)) : ""
  );
  const [estimate, setEstimate] = useState(
    initialTask?.estimateMinutes != null ? String(initialTask.estimateMinutes) : ""
  );
  const [pillar, setPillar] = useState<PillarId>(initialTask?.pillar ?? "academics");

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
    onSubmit({
      title: trimmed,
      pillar,
      deliverableId: deliverableId || undefined,
      dueAt: dueDate ? endOfDay(fromIsoDateLocal(dueDate)).toISOString() : undefined,
      estimateMinutes: estimate ? Number(estimate) : undefined,
      scheduledFor: initialTask?.scheduledFor,
      completedAt: initialTask?.completedAt,
    });
    if (!initialTask) reset();
  }

  const openDeliverables = deliverables.filter(
    (deliverable) => deliverable.completedAt == null || deliverable.id === initialTask?.deliverableId
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task..."
          aria-label={initialTask ? "Task title" : "New task title"}
          className="flex-1"
        />
        <Button
          type="submit"
          size={initialTask ? "sm" : "icon"}
          aria-label={initialTask ? "Save changes" : "Add task"}
          disabled={title.trim().length === 0}
        >
          {initialTask ? "Save" : <Plus className="size-4" />}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
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
        )}
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
          <PillarPicker value={pillar} onChange={setPillar} label="Pillar for task" />
        </div>
      ) : null}
    </form>
  );
}

export { TaskForm };
