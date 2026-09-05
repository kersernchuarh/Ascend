"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AI_FUTURE_ACTIONS } from "@/data/dashboard";

/** Mobile's equivalent of the desktop AiPreviewCard — same fix, same
 *  reasoning: a text input with nowhere for it to go was worse than no
 *  input at all, so it's gone. These four stay as disabled, honestly
 *  labeled product concepts. */
function FloatingAiButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="AI planning — coming soon"
        className="fixed bottom-[80px] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg transition-transform duration-150 active:scale-95 md:hidden"
      >
        <Sparkles className="size-6" strokeWidth={2} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-card border-border">
          <SheetHeader>
            <SheetTitle>AI planning</SheetTitle>
            <SheetDescription>
              Coming soon — not yet connected to your tasks and habits.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-wrap gap-2">
              {AI_FUTURE_ACTIONS.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled
                  className="opacity-60"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { FloatingAiButton };
