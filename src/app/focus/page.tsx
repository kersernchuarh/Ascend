import { Suspense } from "react";
import { FocusSessionView } from "@/components/focus/focus-session-view";

export default function FocusPage() {
  return (
    <Suspense fallback={null}>
      <FocusSessionView />
    </Suspense>
  );
}
