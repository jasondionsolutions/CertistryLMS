// app/(admin)/admin/certifications/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Certification Management Page
 * For creating and managing certification courses
 */
export default async function CertificationsPage() {
  let authContext;
  try {
    authContext = await validateSession();
  } catch {
    redirect("/");
  }

  const isAuthorized = authContext.roles.includes("admin") || authContext.roles.includes("instructor");
  if (!isAuthorized) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certification Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage certification courses
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Certification
        </Button>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Get started by creating your first certification course. Add domains, objectives, videos, and assessments.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Certification
          </Button>
        </div>
      </div>
    </div>
  );
}
