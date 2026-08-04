import Link from "next/link";
import { BarChart3, ChevronRight, Repeat, Settings } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/shared/card";

const MORE_LINKS = [
  { label: "Habits", href: "/habits", icon: Repeat },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function MorePage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="More" description="Everything else, in one place." />
      <Card>
        <div className="flex flex-col divide-y divide-border">
          {MORE_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-12 items-center gap-3 px-6 text-body text-foreground transition-colors duration-150 hover:bg-surface-2"
              >
                <Icon className="size-[18px] text-muted-foreground" strokeWidth={2} />
                <span className="flex-1">{link.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
