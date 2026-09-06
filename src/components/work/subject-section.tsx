"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliverableRow } from "@/components/work/deliverable-row";
import { sortByIsoDate } from "@/domain/time";
import { subjectRemainingCount } from "@/domain/work";
import type { Deliverable, StudySession, Subject, Task } from "@/domain/types";

type SubjectSectionProps = {
  subject: Subject;
  /** Pre-filtered to this subject by the caller (`domain/work.deliverablesForSubject`). */
  deliverables: Deliverable[];
  /** The full task list — `DeliverableRow` filters per deliverable itself. */
  tasks: Task[];
  sessions: StudySession[];
  now: Date;
  onToggleDeliverable: (id: string) => void;
  onDeleteDeliverable: (id: string) => void;
  onDeleteSubject: () => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (input: Omit<Task, "id" | "createdAt">) => void;
};

function SubjectSection({
  subject,
  deliverables,
  tasks,
  sessions,
  now,
  onToggleDeliverable,
  onDeleteDeliverable,
  onDeleteSubject,
  onToggleTask,
  onDeleteTask,
  onCreateTask,
}: SubjectSectionProps) {
  const sorted = sortByIsoDate(deliverables, (d) => d.dueAt);
  const remaining = subjectRemainingCount(deliverables, subject.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-h3 text-foreground">{subject.name}</h3>
        <div className="flex items-center gap-2">
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
              onDelete={() => onDeleteDeliverable(deliverable.id)}
              onToggleTask={onToggleTask}
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
