"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CreateSubjectForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function close() {
    setOpen(false);
    setName("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") close();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        New subject
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Chemistry"
        aria-label="New subject name"
        className="max-w-[220px]"
      />
      <Button type="submit" size="sm" disabled={name.trim().length === 0}>
        Add
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={close}>
        Cancel
      </Button>
    </form>
  );
}

export { CreateSubjectForm };
