import * as React from "react";
import { cn } from "@/lib/utils";
import { ACCENT_CHIP_CLASSES, type AccentColor } from "@/lib/colors";

type PillBadgeProps = {
  color?: AccentColor;
  className?: string;
  children: React.ReactNode;
};

function PillBadge({ color = "primary", className, children }: PillBadgeProps) {
  return (
    <span
      data-slot="pill-badge"
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-4xl px-2 text-caption font-medium whitespace-nowrap",
        ACCENT_CHIP_CLASSES[color],
        className
      )}
    >
      {children}
    </span>
  );
}

export { PillBadge };
