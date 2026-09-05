import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  /** Heading level for `title`. Defaults to 3: the topbar's route title is
   *  every page's one `<h1>`, so a card title one level down is an `<h2>`
   *  only for the page's most structurally important sections — everything
   *  else stays `<h3>` to avoid a false sense of equal importance. */
  level?: 2 | 3;
};

function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
  level = 3,
}: SectionHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";
  const headingSize = level === 2 ? "text-h2" : "text-h3";

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Icon className="size-4" strokeWidth={2} />
          </span>
        ) : null}
        <div className="flex flex-col gap-0.5">
          <Heading className={cn(headingSize, "text-foreground")}>{title}</Heading>
          {description ? (
            <p className="text-body text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SectionHeader };
