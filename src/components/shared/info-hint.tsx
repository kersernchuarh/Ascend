"use client";

import { useState } from "react";
import { Info } from "lucide-react";

/**
 * A tap-or-click disclosure for one sentence of context that would otherwise
 * bloat a screen's primary copy (PRODUCT_BLUEPRINT.md §32) — e.g. Today's
 * "Ascend doesn't build a schedule for you" caveat. Deliberately click-
 * toggled rather than a hover-only tooltip: a hover tooltip has no mobile
 * equivalent, and this content needs to work identically on both.
 */
function InfoHint({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={label}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <Info className="size-3.5" />
      </button>
      {open ? (
        <span
          role="status"
          className="absolute left-1/2 top-full z-10 mt-1.5 w-56 -translate-x-1/2 rounded-[10px] border border-border bg-popover px-3 py-2 text-caption text-muted-foreground shadow-soft motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

export { InfoHint };
