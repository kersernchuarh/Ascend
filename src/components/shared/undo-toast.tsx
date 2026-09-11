"use client";

import { useEffect } from "react";
import { Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UndoableAction = { message: string; undo: () => void };

const AUTO_DISMISS_MS = 6000;

/**
 * A transient, dismissible confirmation for an action that's easy to miss
 * the reversal path for otherwise — "defer" and "complete" both already
 * have a way back (re-add to today; re-check the box), but neither is
 * *discoverable* in the moment, which is what this milestone's "easy to
 * undo" requirement (PRODUCT_BLUEPRINT.md §29) actually asks for. Owned by
 * the caller (`TodayPlanCard`) as plain state — one action at a time, no
 * queue, since a second action replacing the toast before the first is
 * undone is the same trade-off every real toast makes.
 */
function UndoToast({ action, onDismiss }: { action: UndoableAction; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [action, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
    >
      <div className="flex items-center gap-3 rounded-[10px] border border-border bg-surface-2 px-4 py-2.5 shadow-lg">
        <span className="text-body text-foreground">{action.message}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-primary"
          onClick={() => {
            action.undo();
            onDismiss();
          }}
        >
          <Undo2 className="size-3.5" />
          Undo
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={onDismiss}>
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export { UndoToast };
