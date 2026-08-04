"use client";

import { useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/shared/card";
import { AI_QUICK_ACTIONS } from "@/data/dashboard";

function AiCommandBar() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleQuickAction(action: string) {
    setValue(action);
    inputRef.current?.focus();
  }

  return (
    <Card className="hidden md:flex items-center gap-3 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="flex-1 flex flex-wrap gap-2 min-w-0">
        {AI_QUICK_ACTIONS.map((action) => (
          <Button
            key={action}
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction(action)}
          >
            {action}
          </Button>
        ))}
      </div>
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask Ascend anything..."
        className="flex-1 min-w-0"
      />
      <Button size="icon" disabled={value.trim().length === 0}>
        <ArrowUp className="size-4" />
      </Button>
    </Card>
  );
}

export { AiCommandBar };
