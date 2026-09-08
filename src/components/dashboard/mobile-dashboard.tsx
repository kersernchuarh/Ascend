import { HomeHeader } from "@/components/dashboard/home-header";
import { TodayPlanCard } from "@/components/dashboard/today-plan-card";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { ScheduleCard } from "@/components/dashboard/schedule-card";
import { HabitTrackerCard } from "@/components/dashboard/habit-tracker-card";
import { TodayProgressStrip } from "@/components/dashboard/today-progress-strip";

/**
 * Mobile shares the exact same six Home v2 sections as desktop (no
 * stripped-down parallel cards — the same lesson §9.3 already applied to
 * `TaskRow`/`HabitRow`), just reordered for mobile's own priorities: the
 * plan and what needs attention lead, since a phone is for acting on today,
 * not surveying the whole week (§21's responsive-bias guidance).
 */
function MobileDashboard() {
  return (
    <div className="flex w-full flex-col gap-6">
      <HomeHeader />
      <TodayPlanCard />
      <AttentionCard />
      <ScheduleCard />
      <HabitTrackerCard />
      <TodayProgressStrip />
    </div>
  );
}

export { MobileDashboard };
