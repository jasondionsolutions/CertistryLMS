// app/(student)/dashboard/study-tools/page.tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/validateSession";
import { Lightbulb, Calendar, BookMarked, ListChecks, Timer, Zap } from "lucide-react";

export default async function StudyToolsPage() {
  try {
    await validateSession();
  } catch {
    redirect("/");
  }

  const studyTools = [
    {
      title: "Study Schedule Builder",
      description: "Create a personalized study schedule based on your exam date",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Spaced Repetition",
      description: "Optimize your review schedule with proven learning techniques",
      icon: Timer,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Study Guide Generator",
      description: "Generate custom study guides for specific exam objectives",
      icon: BookMarked,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Practice Test Strategy",
      description: "Learn proven test-taking strategies and techniques",
      icon: Lightbulb,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
    {
      title: "Weak Area Targeting",
      description: "Focus on areas where you need the most improvement",
      icon: Zap,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950",
    },
    {
      title: "Study Checklist",
      description: "Track your completion of all exam objectives",
      icon: ListChecks,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Strategic Study Tools</h1>
        <p className="text-muted-foreground mt-2">
          Advanced tools and strategies to optimize your exam preparation
        </p>
      </div>

      {/* Study Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studyTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.title}
              className="group text-left rounded-lg border bg-card p-6 hover:border-primary transition-colors"
            >
              <div className={`inline-flex p-3 rounded-lg ${tool.bgColor} mb-4`}>
                <Icon className={`h-6 w-6 ${tool.color}`} />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="font-semibold mb-4">Study Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Use spaced repetition to improve long-term retention</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Practice with realistic exam simulations before your test date</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Focus on weak areas identified through practice exams</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Review flashcards daily to reinforce key concepts</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
