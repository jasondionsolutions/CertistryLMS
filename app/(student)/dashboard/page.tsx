// app/(student)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import Link from "next/link";
import { BookOpen, Target, Brain, TrendingUp, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Student Dashboard Page
 * Main dashboard for students/users
 */
export default async function DashboardPage() {
  let authContext;
  try {
    authContext = await validateSession();
  } catch {
    redirect("/");
  }

  const quickActions = [
    {
      title: "My Learning Path",
      description: "Continue your personalized learning journey",
      icon: Target,
      href: "/dashboard/learning-path",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Practice Exams",
      description: "Test your knowledge with practice exams",
      icon: BookOpen,
      href: "/dashboard/practice-exams",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Flashcards",
      description: "Review key concepts with flashcards",
      icon: Brain,
      href: "/dashboard/flashcards",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Strategic Study Tools",
      description: "Access advanced study tools and strategies",
      icon: Award,
      href: "/dashboard/study-tools",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {authContext.name || authContext.email}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Continue your certification journey
        </p>
      </div>

      {/* Current Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Current Goal</h3>
          </div>
          <p className="text-2xl font-bold mt-2">Not Set</p>
          <p className="text-xs text-muted-foreground mt-1">Choose a certification to begin</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
          </div>
          <p className="text-2xl font-bold mt-2">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Complete your first lesson</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Study Time</h3>
          </div>
          <p className="text-2xl font-bold mt-2">0 hrs</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-lg border bg-card p-6 hover:border-primary transition-colors"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Get Started Section */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-8">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold mb-2">Ready to start your certification journey?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a certification path, set your goals, and let us create a personalized study plan for you.
          </p>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Certifications
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
