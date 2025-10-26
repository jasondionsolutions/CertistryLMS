"use client";

/**
 * DocumentViewer Component
 *
 * In-browser PDF viewer with react-pdf
 * For DOCX/TXT, shows download option
 */

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  url: string;
  title: string;
  type: "pdf" | "docx" | "txt";
  allowDownload?: boolean;
}

export function DocumentViewer({
  url,
  title,
  type,
  allowDownload = true,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF");
    setLoading(false);
  };

  const handleDownload = () => {
    window.open(url, "_blank");
  };

  // For non-PDF files, show download option
  if (type !== "pdf") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {type.toUpperCase()} file
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Preview not available for {type.toUpperCase()} files
            </p>
            {allowDownload && (
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // PDF viewer
  return (
    <div className="space-y-4">
      {/* PDF Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || "..."}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
                disabled={pageNumber >= numPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {allowDownload && (
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Document */}
      <Card>
        <CardContent className="p-6">
          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={800}
              />
            </Document>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
