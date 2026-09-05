"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_USER, ROUTE_TITLES } from "@/data/mock";

/**
 * The route title here is every page's ONE `<h1>` — page-level content
 * (the old `Hero` greeting, `ComingSoon`'s heading) uses `<h2>` or lower.
 * Search and notifications were removed rather than fixed: both rendered
 * with no handler at all — a keyboard-focusable, visually "live" control
 * that does nothing is worse than no control, and neither is being built
 * this phase. The avatar now links to Settings, a real destination,
 * instead of just looking clickable.
 */
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

      <Link
        href="/settings"
        aria-label={`${MOCK_USER.name}'s account settings`}
        className="rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-8 cursor-pointer">
          <AvatarFallback className="bg-primary/15 text-primary text-caption font-semibold">
            {MOCK_USER.initials}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}

export { Topbar };
