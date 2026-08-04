"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_FOOTER_NAV, SIDEBAR_NAV, MOCK_USER } from "@/data/mock";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "@/data/mock";

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-button px-3 text-body font-medium transition-colors duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-border px-4",
          collapsed ? "justify-center px-0" : "justify-between"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            collapsed && "justify-center"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <Mountain className="size-[18px]" strokeWidth={2.25} />
          </span>
          {!collapsed ? (
            <span className="text-h3 font-semibold tracking-tight text-foreground">
              Ascend
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {SIDEBAR_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-3">
        {SIDEBAR_FOOTER_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
          />
        ))}

        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex h-10 items-center gap-3 rounded-button px-3 text-body font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-[18px]" strokeWidth={2} />
          ) : (
            <>
              <ChevronsLeft className="size-[18px] shrink-0" strokeWidth={2} />
              <span>Collapse</span>
            </>
          )}
        </button>

        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-button p-2",
            collapsed && "justify-center p-0"
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/15 text-primary text-caption font-semibold">
              {MOCK_USER.initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-body font-medium text-foreground">
                {MOCK_USER.name}
              </span>
              <span className="truncate text-caption text-muted-foreground">
                {MOCK_USER.plan}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
