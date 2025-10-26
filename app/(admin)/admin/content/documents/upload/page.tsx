/**
 * Document Upload Page
 *
 * Upload new documents (PDF, DOCX, TXT)
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/modules/content/ui/DocumentUploadForm";
import { ChevronLeft } from "lucide-react";

export default function UploadDocumentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/content/documents">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Upload Document</h1>
        <p className="text-muted-foreground">
          Upload PDF, DOCX, or TXT files for student reference
        </p>
      </div>

      <DocumentUploadForm />
    </div>
  );
}
