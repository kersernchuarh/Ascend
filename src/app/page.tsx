import { HomeHeader } from "@/components/dashboard/home-header";
import { TodayPlanCard } from "@/components/dashboard/today-plan-card";
import { ScheduleCard } from "@/components/dashboard/schedule-card";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { TodayProgressStrip } from "@/components/dashboard/today-progress-strip";
import { HabitTrackerCard } from "@/components/dashboard/habit-tracker-card";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";

export default function Home() {
  return (
    <>
      {/*
        Home v2 hierarchy (PRODUCT_BLUEPRINT.md §32's layout refinement):
        a main column carrying today's actual work — Today's Plan (the
        centerpiece) plus Attention when there's genuinely something to
        flag (it hides itself otherwise, so an "all clear" day doesn't cost
        a section) — next to a narrower supporting column for how today
        looks structurally (fixed Schedule, a compact Habits glance).
        Progress stays a small, secondary strip at the very bottom, never
        competing with the task list above it for attention.
      */}
      <div className="hidden flex-col gap-6 md:flex">
        <HomeHeader />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <TodayPlanCard />
            <AttentionCard />
          </div>
          <div className="flex flex-col gap-6">
            <ScheduleCard />
            <HabitTrackerCard />
          </div>
        </section>

        <TodayProgressStrip />
      </div>

      <div className="md:hidden">
        <MobileDashboard />
      </div>
    </>
  );
}
