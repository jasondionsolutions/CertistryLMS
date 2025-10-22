// app/(admin)/admin/users/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

/**
 * User Management Page
 * For managing user accounts
 */
export default async function UsersPage() {
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Users will appear here once they sign up or are added to the system.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add First User
          </Button>
        </div>
      </div>
    </div>
  );
}
