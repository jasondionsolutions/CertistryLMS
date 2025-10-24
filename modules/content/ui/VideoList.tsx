"use client";

/**
 * Video List Component
 *
 * Displays list of uploaded videos with transcription status
 */

import { useQuery } from "@tanstack/react-query";
import { listVideos } from "../serverActions/video.action";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranscriptionStatus } from "./TranscriptionStatus";
import { Loader2 } from "lucide-react";

export function VideoList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const result = await listVideos({ limit: 50, offset: 0 });
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load videos");
      }
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load videos: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!data || data.videos.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">
          No videos uploaded yet. Use the &quot;Upload Video&quot; button to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Showing {data.videos.length} of {data.total} videos
      </div>

      <div className="grid gap-4">
        {data.videos.map((video) => (
          <Card key={video.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                    {video.videoCode && (
                      <Badge variant="outline" className="shrink-0">
                        {video.videoCode}
                      </Badge>
                    )}
                  </div>

                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {(video.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <span>•</span>
                    <Badge variant="secondary" className="capitalize">
                      {video.difficultyLevel}
                    </Badge>
                    <span>•</span>
                    <span className="text-xs">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <TranscriptionStatus videoId={video.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
