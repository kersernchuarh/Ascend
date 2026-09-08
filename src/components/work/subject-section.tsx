"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliverableRow } from "@/components/work/deliverable-row";
import { sortByIsoDate } from "@/domain/time";
import { subjectRemainingCount } from "@/domain/work";
import type { DeliverableFormInput } from "@/components/work/deliverable-form";
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
};

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
}: SubjectSectionProps) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(subject.name);
  const sorted = sortByIsoDate(deliverables, (d) => d.dueAt);
  const remaining = subjectRemainingCount(deliverables, subject.id);

  function commitRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== subject.name) onRenameSubject(trimmed);
    else setName(subject.name);
    setRenaming(false);
  }

  return (
    <div className="flex flex-col gap-2">
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
            onClick={() => setRenaming(true)}
            className="group flex min-w-0 items-center gap-1.5 text-left"
            aria-label={`Rename subject "${subject.name}"`}
          >
            <h3 className="text-h3 text-foreground">{subject.name}</h3>
            <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-caption text-muted-foreground">
            {deliverables.length === 0 ? "No deliverables" : remaining === 0 ? "All caught up" : `${remaining} remaining`}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label={`Delete subject "${subject.name}"`} onClick={onDeleteSubject}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="py-1 text-caption text-muted-foreground">No deliverables yet.</p>
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
    </div>
  );
}

export { SubjectSection };
