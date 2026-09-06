"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PillarPicker } from "@/components/shared/pillar-picker";
import type { PillarId } from "@/lib/pillars";

function AddTaskRow({ onAdd }: { onAdd: (title: string, pillar: PillarId) => void }) {
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<PillarId>("academics");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, pillar);
    setTitle("");
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
        <Button
          type="submit"
          size="icon"
          aria-label="Add task"
          disabled={title.trim().length === 0}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <PillarPicker value={pillar} onChange={setPillar} label="Pillar for new task" />
    </form>
  );
}

export { AddTaskRow };
