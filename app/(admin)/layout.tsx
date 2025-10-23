import { TopNav } from "@/components/navigation/top-nav";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { BreadcrumbProvider } from "@/components/navigation/breadcrumb-context";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/certifications", label: "Certifications" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbProvider>
      <div className="min-h-screen flex flex-col">
        <TopNav navLinks={adminNavLinks} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </BreadcrumbProvider>
  );
}
