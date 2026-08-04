import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FloatingAiButton } from "@/components/layout/floating-ai-button";

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

function AppShell({ children, title }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} />
          <main className="flex-1 px-4 pb-[96px] pt-6 md:px-8 md:pb-10 md:pt-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
      <MobileBottomNav />
      <FloatingAiButton />
    </SidebarProvider>
  );
}

export { AppShell };
