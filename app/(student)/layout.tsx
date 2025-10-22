import { TopNav } from "@/components/navigation/top-nav";
import { Breadcrumb } from "@/components/navigation/breadcrumb";

const studentNavLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/learning-path", label: "My Learning Path" },
  { href: "/dashboard/practice-exams", label: "Practice Exams" },
  { href: "/dashboard/flashcards", label: "Flashcards" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/study-tools", label: "Strategic Study Tools" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav navLinks={studentNavLinks} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
