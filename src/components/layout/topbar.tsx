"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_USER, ROUTE_TITLES } from "@/data/mock";

function Topbar() {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname];

  return (
    <header className="sticky top-0 z-10 hidden h-[72px] shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md md:flex">
      <div className="min-w-0">
        {title ? (
          <h1 className="truncate text-h3 text-foreground">{title}</h1>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-64 items-center gap-2 rounded-input border border-border bg-surface-2 px-3 text-body text-muted-foreground transition-colors duration-150 hover:border-[#2a3441] hover:text-foreground"
        >
          <Search className="size-4 shrink-0" strokeWidth={2} />
          <span className="flex-1 truncate text-left">Search Ascend...</span>
          <kbd className="rounded-[6px] border border-border bg-surface px-1.5 py-0.5 text-caption text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 shrink-0 items-center justify-center rounded-button text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
        >
          <Bell className="size-[18px]" strokeWidth={2} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>

        <Avatar className="size-8 cursor-pointer">
          <AvatarFallback className="bg-primary/15 text-primary text-caption font-semibold">
            {MOCK_USER.initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export { Topbar };
