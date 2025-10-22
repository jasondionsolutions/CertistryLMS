// app/admin/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { AuthButton } from "@/components/auth-button";

/**
 * Admin Dashboard Page
 *
 * Accessible only to users with "admin" role
 */
export default async function AdminPage() {
  // Validate session - throws if not authenticated
  let authContext;
  try {
    authContext = await validateSession();
  } catch (error) {
    // Redirect to home if not authenticated
    redirect("/");
  }

  // Check if user has admin role
  if (!authContext.roles.includes("admin")) {
    // Redirect to dashboard if not admin
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              System administration and management
            </p>
          </div>
          <AuthButton />
        </div>

        {/* Admin Info Card */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-6 py-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-destructive">⚠️</span>
            Admin Access Granted
          </h2>

          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin:</span>
              <span className="font-medium">{authContext.name || authContext.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{authContext.email}</span>
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
                    className="inline-block px-2 py-1 bg-destructive/20 text-destructive rounded-md text-xs ml-1"
                  >
                    {role}
                  </span>
                ))}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Admin Permissions:</span>
              <div className="flex flex-wrap gap-1 max-w-md justify-end">
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

        {/* Admin Management Sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="space-y-3">
              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Manage Users</h3>
                <p className="text-sm text-muted-foreground">
                  View, create, edit, and delete user accounts
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Roles & Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Assign roles and manage user permissions
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">User Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View user activity and engagement metrics
                </p>
              </div>
            </div>
          </div>

          {/* Content Management */}
          <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
            <h2 className="text-xl font-semibold">Content Management</h2>
            <div className="space-y-3">
              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Manage Courses</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage course content
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Certifications</h3>
                <p className="text-sm text-muted-foreground">
                  Manage certification programs
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Exam Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage exams and questions
                </p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
            <h2 className="text-xl font-semibold">System Settings</h2>
            <div className="space-y-3">
              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Application Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure system-wide settings
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Email Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Manage notification templates
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">System Logs</h3>
                <p className="text-sm text-muted-foreground">
                  View system activity and error logs
                </p>
              </div>
            </div>
          </div>

          {/* Analytics & Reports */}
          <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
            <h2 className="text-xl font-semibold">Analytics & Reports</h2>
            <div className="space-y-3">
              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Dashboard Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View comprehensive system analytics
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Revenue Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Track revenue and financial metrics
                </p>
              </div>

              <div className="p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-1">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Export system data for analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="bg-muted/40 border rounded-lg px-6 py-4">
          <p className="text-sm">
            <a href="/dashboard" className="font-medium underline hover:text-primary">
              ← Back to User Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
