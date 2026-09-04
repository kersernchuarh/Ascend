import { Hero } from "@/components/dashboard/hero";
import { TodaysFocusCard } from "@/components/dashboard/todays-focus-card";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { WeeklyBalanceDonut } from "@/components/dashboard/weekly-balance-donut";
import { StudyTimerCard } from "@/components/dashboard/study-timer-card";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { HabitTrackerCard } from "@/components/dashboard/habit-tracker-card";
import { AiCommandBar } from "@/components/dashboard/ai-command-bar";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";

export default function Home() {
  return (
    <>
      <div className="hidden flex-col gap-6 md:flex">
        <Hero />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <TodaysFocusCard />
          <UpcomingCard />
          <WeeklyBalanceDonut />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <StudyTimerCard />
          <AiInsightCard />
          <HabitTrackerCard />
        </section>

        <AiCommandBar />
      </div>

      <div className="md:hidden">
        <MobileDashboard />
      </div>
    </>
  );
}
