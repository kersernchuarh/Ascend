import * as React from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/shared/card";
import { ACCENT_CHIP_CLASSES, type AccentColor } from "@/lib/colors";

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  color?: AccentColor;
  trend?: {
    direction: "up" | "down";
    value: string;
    /** whether an "up" trend should read as good (green) or bad (red) */
    isPositive?: boolean;
  };
  className?: string;
};

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  color = "primary",
  trend,
  className,
}: MetricCardProps) {
  const trendGood = trend ? trend.isPositive ?? trend.direction === "up" : false;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[10px]",
            ACCENT_CHIP_CLASSES[color]
          )}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
        {trend ? (
          <span
            className={cn(
              "flex items-center gap-1 text-caption font-medium",
              trendGood ? "text-green" : "text-red"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-h1 text-foreground">{value}</span>
        {unit ? (
          <span className="text-body text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      <p className="mt-1 text-body text-muted-foreground">{label}</p>
    </Card>
  );
}

export { MetricCard };
