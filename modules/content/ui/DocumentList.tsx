"use client";

/**
 * DocumentList Component
 *
 * Displays all documents in a table with actions
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "../hooks/useDocuments";
import { ViewDocumentDialog } from "./ViewDocumentDialog";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";
import { generateDocumentDownloadUrl } from "../serverActions/document.action";
import { FileText, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";

export function DocumentList() {
  const { data, isLoading } = useDocuments();

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.documents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by uploading your first document
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/content/documents/upload">Upload Document</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.total} document{data.total !== 1 ? "s" : ""} total
        </p>
        <Button asChild>
          <Link href="/admin/content/documents/upload">Upload Document</Link>
        </Button>
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Document</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">Size</th>
                  <th className="p-4 text-left text-sm font-medium">Version</th>
                  <th className="p-4 text-left text-sm font-medium">Mappings</th>
                  <th className="p-4 text-left text-sm font-medium">Created</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                          {getFileIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.allowDownload && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Download className="h-3 w-3" />
                              <span>Downloadable</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{doc.type.toUpperCase()}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">v{doc.version}</Badge>
                    </td>
                    <td className="p-4">
                      {doc.mappingCount > 0 ? (
                        <Badge>{doc.mappingCount}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <ViewDocumentDialog
                          documentId={doc.id}
                          documentTitle={doc.title}
                        />
                        <EditDocumentDialog
                          documentId={doc.id}
                          documentTitle={doc.title}
                        />
                        {doc.allowDownload && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                const result = await generateDocumentDownloadUrl(doc.id);
                                if (result.success && result.data) {
                                  window.open(result.data, "_blank");
                                } else {
                                  toast.error(result.error || "Failed to generate download URL");
                                }
                              } catch (error) {
                                toast.error("Failed to download document");
                                console.error("Download error:", error);
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/content/documents/${doc.id}/map-objectives`}>
                            <LinkIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteDocumentDialog
                          documentId={doc.id}
                          documentTitle={doc.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
