// app/(student)/dashboard/flashcards/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Button } from "@/components/ui/button";
import { Brain, Plus } from "lucide-react";

export default async function FlashcardsPage() {
  try {
    await validateSession();
  } catch {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Review key concepts with spaced repetition
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Flashcard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Cards</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Due Today</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Mastered</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first flashcard or start a lesson to generate flashcards automatically.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Flashcard
          </Button>
        </div>
      </div>
    </div>
  );
}
