import { NowPanel } from "@/components/dashboard/now-panel";
import { TodaysFocusCard } from "@/components/dashboard/todays-focus-card";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { TodayProgressStrip } from "@/components/dashboard/today-progress-strip";
import { HabitTrackerCard } from "@/components/dashboard/habit-tracker-card";
import { AiPreviewCard } from "@/components/dashboard/ai-preview-card";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";

export default function Home() {
  return (
    <>
      {/*
        Hierarchy, top to bottom, per product direction: (1) what should I
        do now — NowPanel; (2) what's most important today — Today's Focus,
        given real width rather than an equal third; (3) what deadlines
        need attention — Upcoming; (4) how am I progressing — real derived
        numbers, then the habit detail; (5) useful context — AI, kept last
        and visually quiet since it does nothing yet.
      */}
      <div className="hidden flex-col gap-6 md:flex">
        <NowPanel />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TodaysFocusCard />
          </div>
          <UpcomingCard />
        </section>

        <TodayProgressStrip />

        <HabitTrackerCard />

        <AiPreviewCard />
      </div>

      <div className="md:hidden">
        <MobileDashboard />
      </div>
    </>
  );
}
