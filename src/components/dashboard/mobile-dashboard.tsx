import { NowPanel } from "@/components/dashboard/now-panel";
import { TodaysFocusCard } from "@/components/dashboard/todays-focus-card";
import { WeekStripCard } from "@/components/dashboard/week-strip-card";
import { UpcomingCard } from "@/components/dashboard/upcoming-card";
import { TodayProgressStrip } from "@/components/dashboard/today-progress-strip";
import { HabitTrackerCard } from "@/components/dashboard/habit-tracker-card";
import { AiPreviewCard } from "@/components/dashboard/ai-preview-card";

/**
 * Previously a parallel reimplementation of task/habit rows at reduced
 * density (a capped 4-task, 3-habit read-only preview). None of the cards
 * below carry desktop-specific sizing, and capping the task list to 4 would
 * now hide real interactive capability (reorder, remove, quick-add) that
 * exists nowhere else in the app — so mobile gets the same cards, in an
 * order suited to its own hierarchy, rather than a stripped-down copy.
 * `WeekStripCard` is the one piece with no desktop equivalent.
 */
function MobileDashboard() {
  return (
    <div className="flex w-full flex-col gap-6">
      <NowPanel />
      <TodaysFocusCard />
      <WeekStripCard />
      <UpcomingCard />
      <TodayProgressStrip />
      <HabitTrackerCard />
      <AiPreviewCard />
    </div>
  );
}

export { MobileDashboard };
