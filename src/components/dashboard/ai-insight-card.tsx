import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";

/**
 * The old copy here ("your productivity is 18% higher than last week") was
 * an invented, unfalsifiable claim — no session or habit history exists to
 * compute anything like it. Real insights need that history plus the AI
 * capability set described in PRODUCT_BLUEPRINT.md §19, which is gated on
 * the domain model, sessions and persistence landing first (Phases 2-3, 7).
 * An honest "not yet" beats a confident, invented number.
 */
function AiInsightCard() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          icon={Sparkles}
          title="AI Insight"
          description="Appears once there's enough to learn from"
        />
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <p className="text-body text-muted-foreground">Not enough activity yet</p>
          <p className="max-w-[260px] text-caption text-muted-foreground">
            Insights appear once you have a few days of real tasks and habits logged.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { AiInsightCard };
