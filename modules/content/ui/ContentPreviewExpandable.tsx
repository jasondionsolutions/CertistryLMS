"use client";

import { ChevronDown, ChevronUp, Link2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { UnifiedContentItem } from "../types/contentLibrary.types";
import { formatDistance } from "date-fns";
import Link from "next/link";

interface ContentPreviewExpandableProps {
  content: UnifiedContentItem;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Mobile expandable preview
 * Renders inline below the content item when expanded
 */
export function ContentPreviewExpandable({
  content,
  isExpanded,
  onToggle,
}: ContentPreviewExpandableProps) {
  return (
    <div className="lg:hidden">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full justify-between"
      >
        <span className="text-xs">
          {isExpanded ? "Hide" : "Show"} Preview
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-muted/30 rounded-lg mt-2">
          {/* Preview placeholder */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Preview available on desktop
            </p>
          </div>

          {/* Description */}
          {content.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">
                {content.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {content.contentType === "video" && content.duration && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{formatDuration(content.duration)}</p>
              </div>
            )}
            {content.fileSize && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Size</p>
                <p className="font-medium">{formatBytes(content.fileSize)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="font-medium text-xs">
                {formatDistance(content.createdAt, new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mappings</p>
              <p className="font-medium">
                {content.mappingCount > 0
                  ? `${content.mappingCount} mapping${content.mappingCount !== 1 ? "s" : ""}`
                  : "None"}
              </p>
            </div>
          </div>

          {/* Certification */}
          {content.certification && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Certification
              </p>
              <Badge variant="secondary" className="text-xs">
                {content.certification.code} - {content.certification.name}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link
                href={
                  content.contentType === "video"
                    ? `/admin/content/videos/${content.id}/map-objectives`
                    : `/admin/content/documents/${content.id}/map-objectives`
                }
              >
                <Link2 className="h-4 w-4 mr-2" />
                Map
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <a
                href={`#download-${content.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                View
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format duration
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
