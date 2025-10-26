"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileVideo,
  FileText,
  Clock,
  HardDrive,
  Link2,
  X,
  Download,
  Loader2,
} from "lucide-react";
import type { UnifiedContentItem } from "../types/contentLibrary.types";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { getVideoPlaybackUrl } from "../serverActions/video.action";
import { getDocumentDownloadUrl } from "../serverActions/document.action";
import { getVideo } from "../serverActions/video.action";
import { getDocument } from "../serverActions/document.action";

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
            <MappingsSection content={content} />

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
 * Mappings section component
 */
function MappingsSection({ content }: { content: UnifiedContentItem }) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchMappings() {
      try {
        setLoading(true);

        if (content.contentType === "video") {
          const result = await getVideo(content.id);
          if (!mounted) return;

          if (result.success && result.data) {
            setMappings(result.data.contentMappings || []);
          }
        } else {
          const result = await getDocument(content.id);
          if (!mounted) return;

          if (result.success && result.data) {
            setMappings(result.data.contentMappings || []);
          }
        }
      } catch (err) {
        console.error("Error fetching mappings:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (content.mappingCount > 0) {
      fetchMappings();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [content.id, content.contentType, content.mappingCount]);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Objective Mappings</h4>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : mappings.length > 0 ? (
        <div className="space-y-2">
          {mappings.map((mapping: any) => {
            // Build hierarchy string
            let hierarchy = "";
            if (mapping.subBullet) {
              const objective = mapping.subBullet.bullet.objective;
              hierarchy = `${objective.domain.name} > ${objective.number} > ${mapping.subBullet.bullet.number} > ${mapping.subBullet.number}`;
            } else if (mapping.bullet) {
              const objective = mapping.bullet.objective;
              hierarchy = `${objective.domain.name} > ${objective.number} > ${mapping.bullet.number}`;
            } else if (mapping.objective) {
              hierarchy = `${mapping.objective.domain.name} > ${mapping.objective.number}`;
            }

            return (
              <div
                key={mapping.id}
                className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
              >
                <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {hierarchy}
                  </p>
                  {mapping.isPrimary && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Primary
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No mappings yet</p>
      )}
    </div>
  );
}

/**
 * Video preview component
 */
function VideoPreview({ content }: { content: UnifiedContentItem }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchVideoUrl() {
      try {
        setLoading(true);
        setError(null);
        const result = await getVideoPlaybackUrl(content.id);

        if (!mounted) return;

        if (result.success && result.data) {
          setVideoUrl(result.data.url);
        } else {
          setError(result.error || "Failed to load video");
        }
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load video");
        console.error("Error fetching video URL:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchVideoUrl();

    return () => {
      mounted = false;
    };
  }, [content.id]);

  if (loading) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <FileVideo className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{error || "Video unavailable"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        controls
        className="w-full h-full"
        poster={content.thumbnailUrl ?? undefined}
      >
        <source src={videoUrl} type="video/mp4" />
        {content.transcript && (
          <track
            kind="subtitles"
            srcLang="en"
            label="English"
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchDownloadUrl() {
      try {
        setLoading(true);
        setError(null);
        const result = await getDocumentDownloadUrl(content.id);

        if (!mounted) return;

        if (result.success && result.data) {
          setDownloadUrl(result.data.url);
        } else {
          setError(result.error || "Failed to generate download link");
        }
      } catch (err) {
        if (!mounted) return;
        setError("Failed to generate download link");
        console.error("Error fetching download URL:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDownloadUrl();

    return () => {
      mounted = false;
    };
  }, [content.id]);

  return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          {content.type?.toUpperCase()} document
        </p>
        {loading ? (
          <Button size="sm" variant="outline" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        ) : error || !downloadUrl ? (
          <p className="text-sm text-destructive">{error || "Download unavailable"}</p>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Download to View
            </a>
          </Button>
        )}
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
