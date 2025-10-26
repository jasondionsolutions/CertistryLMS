/**
 * Document Mapping Page
 *
 * Map document to objectives/bullets/sub-bullets with AI suggestions
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDocument } from "@/modules/content/serverActions/document.action";
import { DocumentMappingClient } from "./DocumentMappingClient";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentMapObjectivesPage({ params }: PageProps) {
  const { id } = await params;

  // Get document
  const documentResult = await getDocument({ id });

  if (!documentResult.success || !documentResult.data) {
    notFound();
  }

  const document = documentResult.data;

  // For now, we'll use the first certification (you can make this selectable later)
  // TODO: Allow user to select which certification to map to
  const certificationId = "cm4gu1y3y0000lpwl6bxhljt0"; // Security+ (replace with dynamic selection)

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/content/documents">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Map Objectives</h1>
        <p className="text-muted-foreground">{document.title}</p>
      </div>

      <DocumentMappingClient
        documentId={id}
        certificationId={certificationId}
      />
    </div>
  );
}
