import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";

/**
 * The old donut averaged six hardcoded numbers into a single "balance
 * score" with no derivation behind it — exactly the invented precision
 * PRODUCT_BLUEPRINT.md principle 1 and §13 rule out. A real score needs
 * logged Session and HabitLog history compared against user-set pillar
 * targets (blueprint §16, §25 — Phase 7), none of which exists yet. An
 * honest "not yet" beats a number nobody can explain.
 */
function WeeklyBalanceDonut() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader title="Weekly Balance" description="How your week adds up" />
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Scale className="size-6 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-body text-muted-foreground">Not enough data yet</p>
          <p className="max-w-[220px] text-caption text-muted-foreground">
            Balance scoring appears once you start logging study sessions and habits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { WeeklyBalanceDonut };
