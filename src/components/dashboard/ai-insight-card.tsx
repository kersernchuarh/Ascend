import { Sparkles, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { AI_INSIGHT } from "@/data/dashboard";

function AiInsightCard() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          icon={Sparkles}
          title="AI Insight"
          description="Personalized, based on your last 7 days"
        />
        <p className="text-body text-foreground leading-relaxed">
          {AI_INSIGHT.message}
        </p>
        <div className="flex items-start gap-2 rounded-input border border-primary/15 bg-primary/5 p-3">
          <Lightbulb className="size-4 shrink-0 mt-0.5 text-primary" />
          <p className="text-body text-muted-foreground">
            {AI_INSIGHT.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { AiInsightCard };
