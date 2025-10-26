"use client";

import { useContentStats } from "../hooks/useContentStats";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileVideo,
  FileText,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
} from "lucide-react";

/**
 * Content statistics dashboard
 * Displays key metrics about the content library
 */
export function ContentStats() {
  const { data: stats, isLoading, error } = useContentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-4">
        <p className="text-sm text-destructive">
          Failed to load statistics. Please try again.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Content */}
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total Items"
          value={stats.totalContent.toString()}
        />

        {/* Videos */}
        <StatCard
          icon={<FileVideo className="h-4 w-4" />}
          label="Videos"
          value={stats.totalVideos.toString()}
        />

        {/* Documents */}
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Documents"
          value={stats.totalDocuments.toString()}
        />

        {/* Video Duration */}
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Total Duration"
          value={stats.totalVideoDurationFormatted}
        />

        {/* Storage */}
        <StatCard
          icon={<HardDrive className="h-4 w-4" />}
          label="Storage Used"
          value={stats.totalStorageFormatted}
        />

        {/* Mapping Coverage */}
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Mapped"
          value={`${stats.mappingCoverage}%`}
        />
      </div>

      {/* Secondary stats - expandable details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Difficulty breakdown */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">By Difficulty</h3>
          <div className="space-y-2">
            <StatRow
              label="Beginner"
              value={stats.byDifficulty.beginner.toString()}
            />
            <StatRow
              label="Intermediate"
              value={stats.byDifficulty.intermediate.toString()}
            />
            <StatRow
              label="Advanced"
              value={stats.byDifficulty.advanced.toString()}
            />
          </div>
        </Card>

        {/* Mapping status */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Mapping Status</h3>
          <div className="space-y-2">
            <StatRow
              label="Mapped"
              value={stats.mappedContent.toString()}
              icon={<CheckCircle className="h-3 w-3 text-green-500" />}
            />
            <StatRow
              label="Unmapped"
              value={stats.unmappedContent.toString()}
              icon={<XCircle className="h-3 w-3 text-muted-foreground" />}
            />
            <StatRow
              label="Coverage"
              value={`${stats.mappingCoverage}%`}
            />
          </div>
        </Card>

        {/* Certifications breakdown */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">By Certification</h3>
          <div className="space-y-2 max-h-20 overflow-y-auto">
            {stats.byCertification.length > 0 ? (
              stats.byCertification.map((cert) => (
                <StatRow
                  key={cert.certificationId ?? "none"}
                  label={cert.certificationCode ?? "None"}
                  value={cert.count.toString()}
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No certifications assigned
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Individual stat card
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

/**
 * Stat row for detail cards
 */
function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
