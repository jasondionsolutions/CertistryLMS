// app/(admin)/admin/questions/tasks/[id]/page.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { TaskWorkspace } from "@/modules/admin/questions/ui";
import { AdminAuthWrapper } from "@/modules/admin/shared/ui";

function TaskWorkspacePageContent() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate a brief loading state to ensure proper hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    router.push("/admin/questions");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading task workspace...
        </div>
      </div>
    );
  }

  // Invalid ID state
  if (!id || typeof id !== "string") {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Invalid Task ID</span>
        </div>
        <p className="text-muted-foreground text-sm">
          The task ID provided is not valid or missing.
        </p>
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Button>
      </div>
    );
  }

  // Valid task ID - render workspace
  return (
    <TaskWorkspace
      taskId={id}
      onBack={handleBack}
    />
  );
}

export default function TaskWorkspacePage() {
  return (
    <AdminAuthWrapper>
      <TaskWorkspacePageContent />
    </AdminAuthWrapper>
  );
}
