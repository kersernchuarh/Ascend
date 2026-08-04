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
import { Button } from "@/components/ui/button";
import { AI_QUICK_ACTIONS } from "@/data/dashboard";

function FloatingAiButton() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

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
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ask Ascend anything..."
              className="h-11"
            />
            <div className="flex flex-wrap gap-2">
              {AI_QUICK_ACTIONS.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setValue(action)}
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
