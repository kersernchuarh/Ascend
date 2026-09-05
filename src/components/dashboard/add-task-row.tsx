"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PILLARS, type PillarId } from "@/lib/pillars";
import { cn } from "@/lib/utils";

const PILLAR_ORDER: PillarId[] = ["academics", "health", "mind", "growth", "life", "productivity"];

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
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pillar for new task">
        {PILLAR_ORDER.map((id) => {
          const p = PILLARS[id];
          const Icon = p.icon;
          const selected = pillar === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={p.label}
              onClick={() => setPillar(id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-[8px] border transition-colors",
                selected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-[#2a3441] hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </form>
  );
}

export { AddTaskRow };
