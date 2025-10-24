import { validateSession } from "@/lib/auth/validateSession";
import { redirect } from "next/navigation";
import { VideoUploadForm } from "@/modules/content/ui/VideoUploadForm";

export const metadata = {
  title: "Upload Video | CertistryLMS Admin",
  description: "Upload a new video to the content library",
};

export default async function VideoUploadPage() {
  // Validate user has content.create permission
  const user = await validateSession();

  const hasPermission = user.permissions.includes("content.create");

  if (!hasPermission) {
    redirect("/dashboard");
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <p className="text-muted-foreground mt-2">
          Upload a video to the content library. Videos will be automatically transcribed for searchability.
        </p>
      </div>

      <VideoUploadForm />
    </div>
  );
}
