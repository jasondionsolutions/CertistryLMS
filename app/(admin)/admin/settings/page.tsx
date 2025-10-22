// app/(admin)/admin/settings/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Bell, Database, Mail, Shield, Palette } from "lucide-react";

/**
 * Admin Settings Page
 * For configuring system settings
 */
export default async function AdminSettingsPage() {
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

  const settingsCategories = [
    {
      title: "General Settings",
      description: "Application name, branding, and basic configuration",
      icon: Palette,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Notifications",
      description: "Configure email notifications and alerts",
      icon: Bell,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Email Configuration",
      description: "SMTP settings and email templates",
      icon: Mail,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Security",
      description: "Authentication, permissions, and security policies",
      icon: Shield,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950",
    },
    {
      title: "Database",
      description: "Database configuration and maintenance",
      icon: Database,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application settings and preferences
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.title}
              className="group text-left rounded-lg border bg-card p-6 hover:border-primary transition-colors"
            >
              <div className={`inline-flex p-3 rounded-lg ${category.bgColor} mb-4`}>
                <Icon className={`h-6 w-6 ${category.color}`} />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </button>
          );
        })}
      </div>

      {/* Current Configuration */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="font-semibold mb-4">Current Configuration</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application Name:</span>
            <span className="font-medium">CertistryLMS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-medium">Development</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database:</span>
            <span className="font-medium">PostgreSQL (Neon)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Storage:</span>
            <span className="font-medium">AWS S3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Authentication:</span>
            <span className="font-medium">AWS Cognito</span>
          </div>
        </div>
      </div>
    </div>
  );
}
