"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Upload, FileVideo, FileText } from "lucide-react";
import { ContentStats } from "@/modules/content/ui/ContentStats";
import { ContentFilters } from "@/modules/content/ui/ContentFilters";
import { ContentGrid } from "@/modules/content/ui/ContentGrid";
import { ContentList } from "@/modules/content/ui/ContentList";
import { ContentPreviewSidebar } from "@/modules/content/ui/ContentPreviewSidebar";
import { ContentPreviewExpandable } from "@/modules/content/ui/ContentPreviewExpandable";
import { ViewToggle } from "@/modules/content/ui/ViewToggle";
import { BulkActionsBar } from "@/modules/content/ui/BulkActionsBar";
import { useContentLibrary } from "@/modules/content/hooks/useContentLibrary";
import { useContentPreview } from "@/modules/content/hooks/useContentPreview";
import type {
  ContentSearchInput,
  UnifiedContentItem,
} from "@/modules/content/types/contentLibrary.types";

/**
 * Content Library Management Page
 * Unified interface for browsing, searching, and managing videos and documents
 */
export default function ContentLibraryPage() {
  // View state
  const [view, setView] = useState<"grid" | "list">("grid");

  // Filter state
  const [filters, setFilters] = useState<ContentSearchInput>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    mappedStatus: "all",
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);

  // Preview state (desktop sidebar)
  const { selectedContent, openPreview, closePreview } = useContentPreview();

  // Fetch content
  const { data, isLoading, error } = useContentLibrary(filters);

  const handleFiltersChange = (newFilters: Partial<ContentSearchInput>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setSelectedIds([]); // Clear selection when filters change
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && data?.items) {
      setSelectedIds(data.items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleItemClick = (item: UnifiedContentItem) => {
    // Desktop: Open sidebar preview
    openPreview(item);
    // Mobile: Toggle expandable preview
    setExpandedMobileId((prev) => (prev === item.id ? null : item.id));
  };

  const handlePageChange = (newPage: number) => {
    handleFiltersChange({ page: newPage });
  };

  // Determine content type for bulk operations
  const selectedContentType =
    data?.items.find((item) => selectedIds.includes(item.id))?.contentType ??
    "video";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Browse, search, and manage all videos and documents
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/content/videos">
              <FileVideo className="h-4 w-4 mr-2" />
              Videos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/content/documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/content/videos/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/content/documents/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <ContentStats />

      {/* Filters & View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 w-full">
          <ContentFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          contentType={selectedContentType}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* Content Grid/List + Preview Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <ContentSkeleton view={view} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load content</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              {view === "grid" ? (
                <div className="space-y-4">
                  <ContentGrid
                    items={data.items}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onItemClick={handleItemClick}
                  />
                  {/* Mobile expandable previews */}
                  <div className="lg:hidden space-y-4">
                    {data.items.map((item) =>
                      expandedMobileId === item.id ? (
                        <ContentPreviewExpandable
                          key={item.id}
                          content={item}
                          isExpanded={true}
                          onToggle={() => setExpandedMobileId(null)}
                        />
                      ) : null
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <ContentList
                    items={data.items}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    onItemClick={handleItemClick}
                  />
                  {/* Mobile expandable previews */}
                  <div className="lg:hidden space-y-4">
                    {data.items.map((item) =>
                      expandedMobileId === item.id ? (
                        <ContentPreviewExpandable
                          key={item.id}
                          content={item}
                          isExpanded={true}
                          onToggle={() => setExpandedMobileId(null)}
                        />
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages} ({data.total} total
                    items)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page - 1)}
                      disabled={data.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page + 1)}
                      disabled={data.page === data.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No content found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Desktop Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ContentPreviewSidebar
              content={selectedContent}
              onClose={closePreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function ContentSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
