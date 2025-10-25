/**
 * Video Objective Mapping Page
 *
 * AI-assisted content mapping interface for linking videos to
 * objectives, bullets, and sub-bullets.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { validateSession } from "@/lib/auth/validateSession";
import { getVideo } from "@/modules/content/serverActions/video.action";
import { VideoMappingClient } from "./VideoMappingClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Video } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoObjectiveMappingPage({ params }: PageProps) {
  // Validate session
  await validateSession();

  // Get video ID from params
  const { id: videoId } = await params;

  // Fetch video data
  const videoResult = await getVideo(videoId);

  if (!videoResult.success || !videoResult.data) {
    notFound();
  }

  const video = videoResult.data;

  // For now, hardcode certification ID - in production, this would come from user context or video metadata
  // TODO: Get certification ID from video metadata or user's current certification
  const certificationId = "cm6faj8fu0000m3rj9iuv02a4"; // Placeholder

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content/videos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Map Video to Objectives</h1>
            <p className="text-sm text-muted-foreground">
              Link this video to relevant exam content
            </p>
          </div>
        </div>
      </div>

      {/* Video Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>{video.title}</CardTitle>
                {video.videoCode && (
                  <p className="text-sm text-muted-foreground">
                    Code: {video.videoCode}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={
                video.transcriptionStatus === "completed"
                  ? "default"
                  : "secondary"
              }
            >
              {video.transcriptionStatus === "completed"
                ? "Transcript Available"
                : "No Transcript"}
            </Badge>
          </div>
        </CardHeader>
        {video.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {video.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Main Mapping Interface */}
      <Suspense fallback={<MappingInterfaceSkeleton />}>
        <VideoMappingClient
          videoId={videoId}
          certificationId={certificationId}
          hasTranscript={video.transcriptionStatus === "completed"}
        />
      </Suspense>
    </div>
  );
}

function MappingInterfaceSkeleton() {
  return (
    <div className="space-y-6">
      {/* AI Suggestions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      {/* Manual Mapping Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* Current Mappings Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
