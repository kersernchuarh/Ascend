import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { AI_FUTURE_ACTIONS } from "@/data/dashboard";

/**
 * Replaces both the old AiCommandBar (a text input with a send button that
 * had no submit handler at all) and AiInsightCard (an honest but redundant
 * second "nothing here yet" placeholder). These four are product concepts,
 * not working buttons — real actions, once the AI capabilities in
 * PRODUCT_BLUEPRINT.md §19 are actually built. Disabled rather than
 * removed: it's honest about being inert while still showing what's coming,
 * without a live-looking text field pretending something is listening.
 */
function AiPreviewCard() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3">
        <SectionHeader
          icon={Sparkles}
          title="AI planning"
          description="Coming soon — not yet connected to your tasks and habits"
        />
        <div className="flex flex-wrap gap-2">
          {AI_FUTURE_ACTIONS.map((action) => (
            <Button
              key={action}
              type="button"
              variant="secondary"
              size="sm"
              disabled
              className="opacity-60"
            >
              {action}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { AiPreviewCard };
