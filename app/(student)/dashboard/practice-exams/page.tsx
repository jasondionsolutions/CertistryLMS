// app/(student)/dashboard/practice-exams/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Button } from "@/components/ui/button";
import { FileText, PlayCircle } from "lucide-react";

export default async function PracticeExamsPage() {
  try {
    await validateSession();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Exams</h1>
          <p className="text-muted-foreground mt-2">
            Test your knowledge and track your progress
          </p>
        </div>
        <Button>
          <PlayCircle className="h-4 w-4 mr-2" />
          Start Practice Exam
        </Button>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No practice exams available</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Practice exams will appear here once you select a certification and complete some lessons.
          </p>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </div>
  );
}
