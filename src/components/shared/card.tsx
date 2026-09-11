import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  /** The one card per screen that's the actual point of the screen (Today's
   *  Plan, Work's Subjects, Plan's This week) — a thin primary-colored top
   *  edge, the only per-card device that says "start here" without resorting
   *  to a second competing shadow/border treatment. At most one per screen. */
  emphasis?: boolean;
  /** For cards that support the primary one rather than compete with it
   *  (Schedule, Attention, Habit Tracker; Work's "Other tasks"; Plan's fixed
   *  schedule/at-risk) — no border or shadow, a faint recessed fill instead,
   *  so a screen with several cards reads as one primary surface plus
   *  supporting context, not a stack of identically-weighted boxes. */
  flat?: boolean;
};

function Card({ className, emphasis, flat, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-card transition-colors duration-200 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
        flat
          ? "border-none bg-surface-2/60"
          : [
              // Every side but the top gets its width/color from these two
              // directional utilities, entirely separate longhand properties
              // from the top border below — so `emphasis`'s top override
              // never has to win a same-property specificity tie against a
              // base `border`/`border-border` shorthand.
              "border-x border-x-border border-b border-b-border bg-card shadow-soft-sm hover:border-x-[#2a3441] hover:border-b-[#2a3441]",
              emphasis ? "border-t-2 border-t-primary" : "border-t border-t-border",
            ],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center justify-between gap-3 p-5 pb-0", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("p-5", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 p-6 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardContent, CardFooter };
