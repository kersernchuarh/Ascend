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
import { Input } from "@/components/ui/input";
import { PillBadge } from "@/components/shared/pill-badge";

const QUICK_ACTIONS = [
  "Plan my week",
  "Generate revision timetable",
  "Summarize homework",
  "How can I improve?",
];

function FloatingAiButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Ascend"
        className="fixed bottom-[80px] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg transition-transform duration-150 active:scale-95 md:hidden"
      >
        <Sparkles className="size-6" strokeWidth={2} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-card border-border">
          <SheetHeader>
            <SheetTitle>Ask Ascend</SheetTitle>
            <SheetDescription>
              Your AI coach for academics, health, and everything in between.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <Input placeholder="Ask Ascend anything..." className="h-11" />
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <PillBadge key={action} color="primary" className="h-7 px-3 text-body">
                  {action}
                </PillBadge>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { FloatingAiButton };
