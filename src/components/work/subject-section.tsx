"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliverableRow } from "@/components/work/deliverable-row";
import { DeliverableForm, type DeliverableFormInput } from "@/components/work/deliverable-form";
import { sortByIsoDate } from "@/domain/time";
import { subjectRemainingCount } from "@/domain/work";
import type { TaskFormInput } from "@/components/work/task-form";
import type { Deliverable, StudySession, Subject, Task } from "@/domain/types";

type SubjectSectionProps = {
  subject: Subject;
  /** Pre-filtered to this subject by the caller (`domain/work.deliverablesForSubject`). */
  deliverables: Deliverable[];
  /** The full task list — `DeliverableRow` filters per deliverable itself. */
  tasks: Task[];
  sessions: StudySession[];
  now: Date;
  onRenameSubject: (name: string) => void;
  onToggleDeliverable: (id: string) => void;
  onUpdateDeliverable: (id: string, input: DeliverableFormInput) => void;
  onDeleteDeliverable: (id: string) => void;
  onDeleteSubject: () => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, input: TaskFormInput) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (input: Omit<Task, "id" | "createdAt">) => void;
  onCreateDeliverable: (input: DeliverableFormInput) => void;
};

/**
 * A compact, collapsible row per subject (PRODUCT_BLUEPRINT.md §32) —
 * collapsed by default when it has nothing outstanding, so an empty or
 * fully-caught-up subject costs one line rather than pushing subjects with
 * real work further down the page; a subject with outstanding assignments
 * opens by default, since that's the content worth seeing immediately. The
 * "add" action for this subject lives inside its own row (a `DeliverableForm`
 * pinned to this subject via `fixedSubjectId`), not in one global form the
 * user has to steer with a picker.
 */
function SubjectSection({
  subject,
  deliverables,
  tasks,
  sessions,
  now,
  onRenameSubject,
  onToggleDeliverable,
  onUpdateDeliverable,
  onDeleteDeliverable,
  onDeleteSubject,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  onCreateDeliverable,
}: SubjectSectionProps) {
  const remaining = subjectRemainingCount(deliverables, subject.id);
  const [expanded, setExpanded] = useState(remaining > 0);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(subject.name);
  const sorted = sortByIsoDate(deliverables, (d) => d.dueAt);

  function commitRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== subject.name) onRenameSubject(trimmed);
    else setName(subject.name);
    setRenaming(false);
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border py-2 last:border-0">
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              commitRename();
            }}
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Subject name"
              autoFocus
              className="h-8 max-w-[220px]"
            />
            <Button type="submit" size="icon-xs" aria-label="Save subject name">
              <Check className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Cancel rename"
              onClick={() => {
                setName(subject.name);
                setRenaming(false);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="group flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            {expanded ? (
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <h3 className="truncate text-body font-medium text-foreground">{subject.name}</h3>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                setRenaming(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  setRenaming(true);
                }
              }}
              aria-label={`Rename subject "${subject.name}"`}
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Pencil className="size-3" />
            </span>
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-caption text-muted-foreground">
            {deliverables.length === 0 ? "Empty" : remaining === 0 ? "All caught up" : `${remaining} remaining`}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label={`Delete subject "${subject.name}"`} onClick={onDeleteSubject}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-2 pl-5">
          {sorted.length === 0 ? (
            <p className="py-1 text-caption text-muted-foreground">No assignments yet.</p>
          ) : (
            <ul>
              {sorted.map((deliverable) => (
                <DeliverableRow
                  key={deliverable.id}
                  deliverable={deliverable}
                  tasks={tasks}
                  sessions={sessions}
                  now={now}
                  onToggle={() => onToggleDeliverable(deliverable.id)}
                  onUpdate={(input) => onUpdateDeliverable(deliverable.id, input)}
                  onDelete={() => onDeleteDeliverable(deliverable.id)}
                  onToggleTask={onToggleTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onCreateTask={onCreateTask}
                />
              ))}
            </ul>
          )}
          <DeliverableForm fixedSubjectId={subject.id} onSubmit={onCreateDeliverable} />
        </div>
      ) : null}
    </div>
  );
}

export { SubjectSection };
