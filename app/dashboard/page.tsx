// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { AuthButton } from "@/components/auth-button";

/**
 * User Dashboard Page
 *
 * Accessible to authenticated users with "user" or higher roles
 */
export default async function DashboardPage() {
  // Validate session - throws if not authenticated
  let authContext;
  try {
    authContext = await validateSession();
  } catch {
    // Redirect to home if not authenticated
    redirect("/");
  }

  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {authContext.name || authContext.email}!
            </p>
          </div>
          <AuthButton />
        </div>

        {/* User Info Card */}
        <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
          <h2 className="text-xl font-semibold">Your Profile</h2>

          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{authContext.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{authContext.name || "Not set"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-xs">{authContext.userId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Roles:</span>
              <span className="font-medium">
                {authContext.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md text-xs ml-1"
                  >
                    {role}
                  </span>
                ))}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Permissions:</span>
              <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                {authContext.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-block px-2 py-1 bg-muted rounded-md text-xs"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">My Courses</h3>
              <p className="text-sm text-muted-foreground">
                View and manage your enrolled courses
              </p>
            </div>

            <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">My Certifications</h3>
              <p className="text-sm text-muted-foreground">
                Track your certification progress
              </p>
            </div>

            <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Practice Exams</h3>
              <p className="text-sm text-muted-foreground">
                Take practice tests to prepare
              </p>
            </div>

            <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Study Materials</h3>
              <p className="text-sm text-muted-foreground">
                Access learning resources
              </p>
            </div>
          </div>
        </div>

        {/* Admin Link (only show if user has admin role) */}
        {authContext.roles.includes("admin") && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-4">
            <p className="text-sm">
              You have admin access.{" "}
              <a href="/admin" className="font-medium underline hover:text-primary">
                Go to Admin Dashboard
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
