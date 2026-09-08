"use client";

import { Sparkles } from "lucide-react";
import type { OnboardingChoice } from "@/persistence/onboarding";

/**
 * Ascend's first-run moment (PRODUCT_BLUEPRINT.md §28 gap #4) — a single,
 * explicit choice, not a wizard. Every other empty state in the app
 * ("nothing here yet — add a subject...") already knows how to guide a
 * genuinely empty user; this screen's only job is making sure that choice
 * is real and made *by the user*, replacing what used to be silent,
 * unconditional demo-data seeding on first load (a direct contradiction of
 * this product's own "never present fabricated activity as real" rule).
 */
function WelcomeScreen({ onChoose }: { onChoose: (choice: OnboardingChoice) => void }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <Sparkles className="size-6" />
        </span>
        <h1 className="text-h1 text-foreground">Welcome to Ascend</h1>
        <p className="max-w-sm text-body text-muted-foreground">
          Your work, your schedule, and your habits, all in one place — computed from what
          actually happens, never guessed.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("fresh")}
          className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface-2 p-5 text-left transition-colors hover:border-primary"
        >
          <span className="text-h3 text-foreground">Start fresh</span>
          <span className="text-caption text-muted-foreground">
            A genuinely empty start — add your own subjects, deadlines, and habits as you go.
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChoose("sample")}
          className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface-2 p-5 text-left transition-colors hover:border-primary"
        >
          <span className="text-h3 text-foreground">Explore with sample data</span>
          <span className="text-caption text-muted-foreground">
            See Ascend populated with a realistic week first, so you can explore before
            entering your own.
          </span>
        </button>
      </div>
    </div>
  );
}

export { WelcomeScreen };
