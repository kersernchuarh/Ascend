"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import { useSubjects } from "@/state/subject-context";
import { endOfDay, fromIsoDateLocal } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";
import type { Deliverable } from "@/domain/types";

type CreateDeliverableFormProps = {
  onCreate: (input: Omit<Deliverable, "id" | "createdAt">) => void;
};

/**
 * The fast path is two fields — title and a due date, the two things that
 * make something a *deliverable* rather than a task (PRODUCT_BLUEPRINT.md
 * §6.1). Subject, estimate, pillar and notes sit behind "More", per Step 5's
 * progressive-disclosure direction. Day-granularity only (no time-of-day
 * picker): every seeded deliverable is already day-granularity, and adding a
 * time field here would be schema ahead of any real need for one.
 */
function CreateDeliverableForm({ onCreate }: CreateDeliverableFormProps) {
  const { subjects } = useSubjects();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [pillar, setPillar] = useState<PillarId>("academics");
  const [estimate, setEstimate] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setTitle("");
    setDueDate("");
    setSubjectId("");
    setPillar("academics");
    setEstimate("");
    setDescription("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !dueDate) return;
    onCreate({
      title: trimmedTitle,
      pillar,
      subjectId: subjectId || undefined,
      dueAt: endOfDay(fromIsoDateLocal(dueDate)).toISOString(),
      allDay: true,
      estimateMinutes: estimate ? Number(estimate) : undefined,
      description: description.trim() || undefined,
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New deliverable — e.g. Chemistry lab report"
          aria-label="New deliverable title"
          className="min-w-[220px] flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Due date"
          className="w-[150px]"
        />
        <Button type="submit" size="icon" aria-label="Add deliverable" disabled={!title.trim() || !dueDate}>
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
            <label className="text-caption text-muted-foreground" htmlFor="deliverable-subject">
              Subject
            </label>
            <select
              id="deliverable-subject"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="h-8 rounded-input border border-input bg-transparent px-2 text-sm text-foreground"
            >
              <option value="">No subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <label className="text-caption text-muted-foreground" htmlFor="deliverable-estimate">
              Estimate (min)
            </label>
            <Input
              id="deliverable-estimate"
              type="number"
              min={0}
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              className="w-20"
            />
          </div>
          <PillarPicker value={pillar} onChange={setPillar} label="Pillar for new deliverable" />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Notes (optional)"
            aria-label="Deliverable notes"
            rows={2}
            className="w-full resize-none rounded-input border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}
    </form>
  );
}

export { CreateDeliverableForm };
