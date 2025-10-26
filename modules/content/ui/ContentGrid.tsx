"use client";

import { FileVideo, FileText, CheckCircle, Clock, FileIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { UnifiedContentItem } from "../types/contentLibrary.types";
import { formatDistance } from "date-fns";

interface ContentGridProps {
  items: UnifiedContentItem[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onItemClick: (item: UnifiedContentItem) => void;
}

/**
 * Grid view of content items with thumbnails/icons
 */
export function ContentGrid({
  items,
  selectedIds,
  onSelect,
  onItemClick,
}: ContentGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No content found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ContentGridItem
          key={item.id}
          item={item}
          isSelected={selectedIds.includes(item.id)}
          onSelect={onSelect}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

/**
 * Individual grid item
 */
function ContentGridItem({
  item,
  isSelected,
  onSelect,
  onItemClick,
}: {
  item: UnifiedContentItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onItemClick: (item: UnifiedContentItem) => void;
}) {
  return (
    <Card
      className={`group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onItemClick(item)}
    >
      {/* Checkbox overlay */}
      <div
        className="absolute top-2 left-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelect(item.id, checked as boolean)
          }
          className="bg-background/80 backdrop-blur"
        />
      </div>

      {/* Thumbnail/Icon */}
      <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
        {item.contentType === "video" ? (
          item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileVideo className="h-16 w-16 text-muted-foreground" />
          )
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileIcon className="h-16 w-16 text-muted-foreground" />
            <Badge variant="secondary" className="uppercase text-xs">
              {item.type}
            </Badge>
          </div>
        )}

        {/* Video duration badge */}
        {item.contentType === "video" && item.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(item.duration)}
          </div>
        )}

        {/* Mapping indicator */}
        {item.mappingCount > 0 && (
          <div className="absolute top-2 right-2">
            <Badge
              variant={item.isPrimaryFor > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {item.mappingCount}
            </Badge>
          </div>
        )}
      </div>

      {/* Content details */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          {item.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {item.contentType === "video" && item.videoCode && (
            <Badge variant="outline" className="text-xs">
              {item.videoCode}
            </Badge>
          )}

          <Badge variant="outline" className="text-xs capitalize">
            {item.difficultyLevel}
          </Badge>

          {item.certification && (
            <Badge variant="secondary" className="text-xs">
              {item.certification.code}
            </Badge>
          )}
        </div>

        {/* Description preview */}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            {formatDistance(item.createdAt, new Date(), { addSuffix: true })}
          </span>
          {item.fileSize && (
            <span>{formatBytes(item.fileSize)}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
