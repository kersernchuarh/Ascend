import { Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { HabitRow } from "@/components/shared/habit-row";
import { HABITS } from "@/data/dashboard";

function HabitTrackerCard() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Habit Tracker"
          description="Today's consistency across your routines"
        />
        {HABITS.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Repeat className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">No habits tracked yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {HABITS.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { HabitTrackerCard };
