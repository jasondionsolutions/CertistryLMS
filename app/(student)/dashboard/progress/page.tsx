// app/(student)/dashboard/progress/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { TrendingUp, Award, Clock, Target } from "lucide-react";

export default async function ProgressPage() {
  try {
    await validateSession();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning progress and achievements
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-medium text-muted-foreground">Overall Progress</h3>
          </div>
          <p className="text-3xl font-bold">0%</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-muted-foreground mt-1">lessons</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-medium text-muted-foreground">Study Time</h3>
          </div>
          <p className="text-3xl font-bold">0h</p>
          <p className="text-xs text-muted-foreground mt-1">this week</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-muted-foreground">Streak</h3>
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-muted-foreground mt-1">days</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No progress data yet</h3>
          <p className="text-sm text-muted-foreground">
            Start learning to see your progress and achievements here.
          </p>
        </div>
      </div>
    </div>
  );
}
