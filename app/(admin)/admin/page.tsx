// app/(admin)/admin/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import Link from "next/link";
import { BookOpen, Users, BarChart } from "lucide-react";

/**
 * Admin Dashboard Page
 * Accessible only to users with "admin" or "instructor" role
 */
export default async function AdminDashboardPage() {
  // Validate session - throws if not authenticated
  let authContext;
  try {
    authContext = await validateSession();
  } catch {
    redirect("/");
  }

  // Check if user has admin or instructor role
  const isAuthorized = authContext.roles.includes("admin") || authContext.roles.includes("instructor");
  if (!isAuthorized) {
    redirect("/dashboard");
  }

  const adminCards = [
    {
      title: "Certification Management",
      description: "Create and manage certification courses, domains, and objectives",
      icon: BookOpen,
      href: "/admin/certifications",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "User Management",
      description: "View, create, and manage user accounts and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {authContext.name || authContext.email}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">No users yet</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Certifications</h3>
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">No certifications yet</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Active Students</h3>
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">No active students</p>
        </div>
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-lg border bg-card p-6 hover:border-primary transition-colors"
              >
                <div className={`inline-flex p-3 rounded-lg ${card.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
