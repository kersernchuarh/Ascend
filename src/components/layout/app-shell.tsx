import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { TaskProvider } from "@/state/task-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FloatingAiButton } from "@/components/layout/floating-ai-button";

type AppShellProps = {
  children: ReactNode;
};

// The shell is rendered from the root layout, which the App Router preserves
// across client-side navigation — so providers mounted here keep their state
// when the user moves between pages.
function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <TaskProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 px-4 pb-[96px] pt-6 md:px-8 md:pb-10 md:pt-8">
              <div className="mx-auto w-full max-w-[1440px]">{children}</div>
            </main>
          </div>
        </div>
        <MobileBottomNav />
        <FloatingAiButton />
      </TaskProvider>
    </SidebarProvider>
  );
}

export { AppShell };
