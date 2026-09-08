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
        Home v2 hierarchy, top to bottom (PRODUCT_BLUEPRINT.md §9.2,
        finally buildable now that CalendarEvent/Preferences are real):
        (1) orientation — who/where/what day, one derived attention signal;
        (2) Today's Plan — the centerpiece, active session or contextual
        "start focus", then the real task list; (3) Schedule — how today
        actually looks; (4) Attention — genuinely at-risk/overdue work,
        each with a concrete reason; (5) Habits due today; (6) a very small
        amount of recent progress, linking out rather than reproducing
        Progress.
      */}
      <div className="hidden flex-col gap-6 md:flex">
        <HomeHeader />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TodayPlanCard />
          </div>
          <div className="flex flex-col gap-6">
            <ScheduleCard />
          </div>
        </section>

        <AttentionCard />

        <HabitTrackerCard />

        <TodayProgressStrip />
      </div>

      <div className="md:hidden">
        <MobileDashboard />
      </div>
    </>
  );
}
