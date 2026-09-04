import { Repeat } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function HabitsPage() {
  return (
    <ComingSoon
      icon={Repeat}
      title="Habits"
      description="Streaks, reminders, and long-term habit trends are coming in a future phase."
    />
  );
}
