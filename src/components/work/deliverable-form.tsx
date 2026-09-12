"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import { useSubjects } from "@/state/subject-context";
import { endOfDay, fromIsoDateLocal, toIsoDateLocal } from "@/domain/time";
import type { PillarId } from "@/lib/pillars";
import type { Deliverable } from "@/domain/types";

export type DeliverableFormInput = Omit<Deliverable, "id" | "createdAt">;

type DeliverableFormProps = {
  /** Pass an existing deliverable to edit it in place, pre-filled. */
  initialDeliverable?: Deliverable;
  onSubmit: (input: DeliverableFormInput) => void;
  onCancel?: () => void;
  /** Preselects a subject and hides the picker — used when this form is
   *  rendered inline under one specific subject's row, so the add action
   *  lives where its destination is obvious rather than in a single global
   *  form the user has to steer with a dropdown. */
  fixedSubjectId?: string;
};

/**
 * Create and edit share one form — the same "no second representation of
 * the same fields" reasoning `plan/event-form.tsx` already established for
 * `CalendarEvent`. Replaces `CreateDeliverableForm`, which only ever
 * created. The fast path stays title + due date; subject/estimate/pillar/
 * notes sit behind "More", open by default when editing (a user editing
 * already has a reason to see the fuller fields, unlike a fresh add).
 *
 * Labeled "Assignment" throughout the visible copy (PRODUCT_BLUEPRINT.md
 * §32) — the student-facing term for what this type models; `Deliverable`
 * stays the internal type/prop name since renaming it would touch every
 * consumer for a purely cosmetic change.
 */
function DeliverableForm({ initialDeliverable, onSubmit, onCancel, fixedSubjectId }: DeliverableFormProps) {
  const { subjects } = useSubjects();
  const [expanded, setExpanded] = useState(!!initialDeliverable);
  const [title, setTitle] = useState(initialDeliverable?.title ?? "");
  const [dueDate, setDueDate] = useState(
    initialDeliverable ? toIsoDateLocal(new Date(initialDeliverable.dueAt)) : ""
  );
  const [subjectId, setSubjectId] = useState(initialDeliverable?.subjectId ?? fixedSubjectId ?? "");
  const [pillar, setPillar] = useState<PillarId>(initialDeliverable?.pillar ?? "academics");
  const [estimate, setEstimate] = useState(
    initialDeliverable?.estimateMinutes != null ? String(initialDeliverable.estimateMinutes) : ""
  );
  const [description, setDescription] = useState(initialDeliverable?.description ?? "");

  function reset() {
    setTitle("");
    setDueDate("");
    if (!fixedSubjectId) setSubjectId("");
    setPillar("academics");
    setEstimate("");
    setDescription("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !dueDate) return;
    onSubmit({
      title: trimmedTitle,
      pillar,
      subjectId: (fixedSubjectId ?? subjectId) || undefined,
      dueAt: endOfDay(fromIsoDateLocal(dueDate)).toISOString(),
      allDay: true,
      estimateMinutes: estimate ? Number(estimate) : undefined,
      description: description.trim() || undefined,
      completedAt: initialDeliverable?.completedAt,
    });
    if (!initialDeliverable) reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New assignment — e.g. Chemistry lab report"
          aria-label={initialDeliverable ? "Assignment title" : "New assignment title"}
          className="min-w-[220px] flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Due date"
          className="w-[150px]"
        />
        <Button
          type="submit"
          size={initialDeliverable ? "sm" : "sm"}
          className="gap-1.5"
          aria-label={initialDeliverable ? "Save changes" : "Add assignment"}
          disabled={!title.trim() || !dueDate}
        >
          {initialDeliverable ? (
            "Save"
          ) : (
            <>
              <Plus className="size-4" />
              Add
            </>
          )}
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
            {!fixedSubjectId ? (
              <>
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
              </>
            ) : null}
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
          <PillarPicker value={pillar} onChange={(p) => setPillar(p ?? "academics")} label="Pillar for assignment" />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Notes (optional)"
            aria-label="Assignment notes"
            rows={2}
            className="w-full resize-none rounded-input border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}
    </form>
  );
}

export { DeliverableForm };
