import { validateSession } from "@/lib/auth/validateSession";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Videos | CertistryLMS Admin",
  description: "Manage video content",
};

export default async function VideosPage() {
  // Validate user has content.read permission
  const user = await validateSession();

  const hasPermission = user.permissions.includes("content.read");

  if (!hasPermission) {
    redirect("/dashboard");
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground mt-2">
            Manage video content and uploads
          </p>
        </div>

        {user.permissions.includes("content.create") && (
          <Button asChild>
            <Link href="/admin/content/videos/upload">
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Link>
          </Button>
        )}
      </div>

      {/* Video list will be added in Issue #19 (Content Library) */}
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">
          Video library coming soon. Use the &quot;Upload Video&quot; button to get started.
        </p>
      </div>
    </div>
  );
}
