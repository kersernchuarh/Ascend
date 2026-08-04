import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Icon className="size-4" strokeWidth={2} />
          </span>
        ) : null}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-h3 text-foreground">{title}</h3>
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
