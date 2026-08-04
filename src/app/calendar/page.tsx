import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="Calendar"
      description="A unified view of classes, deadlines, and life events is coming in a future phase."
    />
  );
}
