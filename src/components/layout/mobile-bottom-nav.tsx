"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV } from "@/data/mock";

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-[64px] items-stretch border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-12 flex-1 flex-col items-center justify-center gap-1"
          >
            <Icon
              className={cn(
                "size-[22px] transition-colors duration-150",
                active ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
            <span
              className={cn(
                "text-caption font-medium transition-colors duration-150",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export { MobileBottomNav };
