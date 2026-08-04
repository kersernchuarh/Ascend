import { CheckSquare } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function TasksPage() {
  return (
    <ComingSoon
      icon={CheckSquare}
      title="Tasks"
      description="Full task management — recurring tasks, priorities, and project grouping — is coming in a future phase."
    />
  );
}
