"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BlueprintManager } from "@/modules/certifications/ui/BlueprintManager";
import { useCertifications } from "@/modules/certifications/hooks/useCertifications";
import { useBreadcrumb } from "@/components/navigation/breadcrumb-context";

export default function BlueprintPage() {
  const params = useParams();
  const router = useRouter();
  const certificationId = params.id as string;
  const { setCustomLabel } = useBreadcrumb();

  // Fetch certification to get name
  const { data: certificationsResponse, isLoading } = useCertifications({
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  const certification = certificationsResponse?.data?.find((cert) => cert.id === certificationId);

  // Set custom breadcrumb label when certification data is available
  React.useEffect(() => {
    if (certification) {
      setCustomLabel(certificationId, certification.name);
    }
  }, [certification, certificationId, setCustomLabel]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/certifications")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/certifications")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Certification Not Found</h1>
        </div>
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">The requested certification could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/certifications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{certification.name}</h1>
          <p className="text-muted-foreground mt-1">{certification.code}</p>
        </div>
      </div>

      {/* Blueprint Manager */}
      <BlueprintManager
        certificationId={certificationId}
        certificationName={certification.name}
      />
    </div>
  );
}
