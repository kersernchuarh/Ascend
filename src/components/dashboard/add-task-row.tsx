"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import { endOfDay, fromIsoDateLocal } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";

export type QuickCaptureInput = {
  title: string;
  pillar?: PillarId;
  dueAt?: string;
  estimateMinutes?: number;
  notes?: string;
};

/**
 * Today's quick capture — the one required field is `title`; every other
 * detail (pillar, deadline, duration, notes) is optional and lives behind
 * "More", closed by default (PRODUCT_BLUEPRINT.md §29). A task jotted down
 * in passing shouldn't have to wait on a pillar decision it doesn't have
 * yet — this is the fast path `TaskForm`'s "More" section already
 * established for Work, brought to Home.
 */
function AddTaskRow({ onAdd }: { onAdd: (input: QuickCaptureInput) => void }) {
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pillar, setPillar] = useState<PillarId | undefined>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setTitle("");
    setPillar(undefined);
    setDueDate("");
    setEstimate("");
    setNotes("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      pillar,
      dueAt: dueDate ? endOfDay(fromIsoDateLocal(dueDate)).toISOString() : undefined,
      estimateMinutes: estimate ? Number(estimate) : undefined,
      notes: notes.trim() || undefined,
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-3">
      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task for today..."
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
          className="shrink-0 gap-1"
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
            <label className="text-caption text-muted-foreground" htmlFor="quick-capture-due">
              Deadline
            </label>
            <Input
              id="quick-capture-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-[150px]"
            />
            <label className="text-caption text-muted-foreground" htmlFor="quick-capture-estimate">
              Duration (min)
            </label>
            <Input
              id="quick-capture-estimate"
              type="number"
              min={0}
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              className="w-20"
            />
          </div>
          <PillarPicker value={pillar} onChange={setPillar} label="Pillar for new task" allowClear />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes or a resource link (optional)"
            aria-label="New task notes"
            rows={2}
            className="w-full resize-none rounded-input border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}
    </form>
  );
}

export { AddTaskRow };
