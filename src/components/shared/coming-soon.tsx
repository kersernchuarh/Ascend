import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-card bg-primary/10 text-primary">
        <Icon className="size-6" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h2 text-foreground">{title}</h2>
        <p className="max-w-sm text-body text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export { ComingSoon };
