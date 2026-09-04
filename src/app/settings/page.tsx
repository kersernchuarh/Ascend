import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Account, notification, and privacy preferences are coming in a future phase."
    />
  );
}
