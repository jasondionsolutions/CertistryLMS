// app/(student)/dashboard/learning-path/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Button } from "@/components/ui/button";
import { Target, Calendar } from "lucide-react";

export default async function LearningPathPage() {
  try {
    await validateSession();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Learning Path</h1>
        <p className="text-muted-foreground mt-2">
          Your personalized certification journey
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No learning path set</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a certification and we&apos;ll create a personalized learning path tailored to your schedule and experience level.
          </p>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Set Up Learning Path
          </Button>
        </div>
      </div>
    </div>
  );
}
