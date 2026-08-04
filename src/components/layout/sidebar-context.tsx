"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "ascend:sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    // One-time sync from a persisted browser preference (localStorage), which
    // cannot be read during SSR — an intentional exception to the lint rule below.
    // useLayoutEffect (not useEffect) so a returning user's collapsed sidebar is
    // corrected before paint, instead of flashing expanded then animating shut.
    const stored = window.localStorage.getItem(STORAGE_KEY) === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(stored);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
