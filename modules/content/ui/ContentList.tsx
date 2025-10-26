"use client";

import { FileVideo, FileText, CheckCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { UnifiedContentItem } from "../types/contentLibrary.types";
import { formatDistance } from "date-fns";

interface ContentListProps {
  items: UnifiedContentItem[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onItemClick: (item: UnifiedContentItem) => void;
}

/**
 * List/table view of content items
 */
export function ContentList({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
  onItemClick,
}: ContentListProps) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No content found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="w-12">Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Certification</TableHead>
            <TableHead className="hidden lg:table-cell">Difficulty</TableHead>
            <TableHead className="hidden lg:table-cell">Duration</TableHead>
            <TableHead className="hidden xl:table-cell">Size</TableHead>
            <TableHead>Mappings</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={`cursor-pointer hover:bg-muted/50 ${
                selectedIds.includes(item.id) ? "bg-muted/30" : ""
              }`}
              onClick={() => onItemClick(item)}
            >
              {/* Checkbox */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    onSelect(item.id, checked as boolean)
                  }
                />
              </TableCell>

              {/* Type icon */}
              <TableCell>
                {item.contentType === "video" ? (
                  <FileVideo className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-orange-500" />
                )}
              </TableCell>

              {/* Title */}
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <span className="line-clamp-1">{item.title}</span>
                  {item.videoCode && (
                    <Badge variant="outline" className="w-fit text-xs">
                      {item.videoCode}
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Certification */}
              <TableCell className="hidden md:table-cell">
                {item.certification ? (
                  <Badge variant="secondary" className="text-xs">
                    {item.certification.code}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>

              {/* Difficulty */}
              <TableCell className="hidden lg:table-cell">
                <Badge
                  variant={
                    item.difficultyLevel === "beginner"
                      ? "secondary"
                      : item.difficultyLevel === "advanced"
                        ? "default"
                        : "outline"
                  }
                  className="text-xs capitalize"
                >
                  {item.difficultyLevel}
                </Badge>
              </TableCell>

              {/* Duration */}
              <TableCell className="hidden lg:table-cell">
                {item.contentType === "video" && item.duration ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatDuration(item.duration)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* File Size */}
              <TableCell className="hidden xl:table-cell text-sm">
                {item.fileSize ? formatBytes(item.fileSize) : "-"}
              </TableCell>

              {/* Mappings */}
              <TableCell>
                {item.mappingCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle
                      className={`h-4 w-4 ${
                        item.isPrimaryFor > 0
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{item.mappingCount}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Unmapped
                  </span>
                )}
              </TableCell>

              {/* Created Date */}
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {formatDistance(item.createdAt, new Date(), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
