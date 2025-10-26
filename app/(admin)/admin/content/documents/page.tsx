/**
 * Documents Library Page
 *
 * Lists all documents with search/filter
 */

import { DocumentList } from "@/modules/content/ui/DocumentList";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Manage study materials and reference documents
        </p>
      </div>

      <DocumentList />
    </div>
  );
}
