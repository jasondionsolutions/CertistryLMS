"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileVideo,
  FileText,
  Clock,
  HardDrive,
  Link2,
  X,
  Download,
} from "lucide-react";
import type { UnifiedContentItem } from "../types/contentLibrary.types";
import { formatDistance } from "date-fns";
import Link from "next/link";

interface ContentPreviewSidebarProps {
  content: UnifiedContentItem | null;
  onClose: () => void;
}

/**
 * Desktop preview sidebar
 * Shows video player, PDF viewer, or text preview
 */
export function ContentPreviewSidebar({
  content,
  onClose,
}: ContentPreviewSidebarProps) {
  if (!content) {
    return (
      <Card className="hidden lg:flex flex-col h-full p-6 items-center justify-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Select content to preview
        </p>
      </Card>
    );
  }

  return (
    <Card className="hidden lg:flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {content.contentType === "video" ? (
              <FileVideo className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm truncate">{content.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {content.difficultyLevel}
            </Badge>
            {content.videoCode && (
              <Badge variant="secondary" className="text-xs">
                {content.videoCode}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Media Preview */}
          {content.contentType === "video" ? (
            <VideoPreview content={content} />
          ) : (
            <DocumentPreview content={content} />
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <Separator />

            {/* Description */}
            {content.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {content.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {content.contentType === "video" && content.duration && (
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Duration"
                  value={formatDuration(content.duration)}
                />
              )}
              {content.fileSize && (
                <DetailItem
                  icon={<HardDrive className="h-4 w-4" />}
                  label="Size"
                  value={formatBytes(content.fileSize)}
                />
              )}
              <DetailItem
                label="Created"
                value={formatDistance(content.createdAt, new Date(), {
                  addSuffix: true,
                })}
              />
              <DetailItem
                label="Updated"
                value={formatDistance(content.updatedAt, new Date(), {
                  addSuffix: true,
                })}
              />
            </div>

            {/* Certification */}
            {content.certification && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Certification</h4>
                  <Badge variant="secondary">
                    {content.certification.code} - {content.certification.name}
                  </Badge>
                </div>
              </>
            )}

            {/* Mappings */}
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Objective Mappings</h4>
              {content.mappingCount > 0 ? (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {content.mappingCount} mapping
                    {content.mappingCount !== 1 ? "s" : ""}
                    {content.isPrimaryFor > 0 &&
                      ` (${content.isPrimaryFor} primary)`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No mappings yet</p>
              )}
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex flex-col gap-2">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link
                  href={
                    content.contentType === "video"
                      ? `/admin/content/videos/${content.id}/map-objectives`
                      : `/admin/content/documents/${content.id}/map-objectives`
                  }
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Map Objectives
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

/**
 * Video preview component
 */
function VideoPreview({ content }: { content: UnifiedContentItem }) {
  // For MVP, we'll use a simple video element
  // In production, you might want to use a player like Video.js or react-player
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        controls
        className="w-full h-full"
        poster={content.thumbnailUrl ?? undefined}
      >
        {/* Note: We'd need to generate signed URLs for private videos */}
        <source src={`${content.id}`} type="video/mp4" />
        {content.transcript && (
          <track
            kind="subtitles"
            srcLang="en"
            label="English"
            // src={content.captionsVttUrl} // If available
          />
        )}
        Your browser does not support the video element.
      </video>
    </div>
  );
}

/**
 * Document preview component
 */
function DocumentPreview({ content }: { content: UnifiedContentItem }) {
  // For MVP, we'll show a placeholder
  // In production, you'd integrate react-pdf for PDFs and text extraction for DOCX/TXT
  return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          {content.type?.toUpperCase()} document preview
        </p>
        <Button size="sm" variant="outline" asChild>
          <a
            href={`#download-${content.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4 mr-2" />
            Download to View
          </a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Detail item component
 */
function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium">{value}</p>
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
