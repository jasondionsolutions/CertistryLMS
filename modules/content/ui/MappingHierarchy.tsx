/**
 * MappingHierarchy Component
 *
 * Displays the full hierarchy for a content mapping:
 * Domain → Objective → Bullet → Sub-bullet
 */

import { Badge } from "@/components/ui/badge";
import type { VideoContentMappingWithHierarchy } from "../types/mapping.types";
import type { DocumentContentMappingWithHierarchy } from "../types/documentMapping.types";

type MappingSuggestionType = {
  domain: { id: string; name: string };
  objective: { id: string; code: string; description: string };
  bullet?: { id: string; text: string };
  subBullet?: { id: string; text: string };
};

interface MappingHierarchyProps {
  mapping: VideoContentMappingWithHierarchy | DocumentContentMappingWithHierarchy | MappingSuggestionType;
  showConfidence?: boolean;
  confidence?: number;
}

export function MappingHierarchy({
  mapping,
  showConfidence = false,
  confidence,
}: MappingHierarchyProps) {
  // Get the domain, objective, bullet, and subBullet
  let domain: { id?: string; name: string };
  let objective: { id?: string; code: string; description: string };
  let bullet: { id?: string; text: string } | undefined;
  let subBullet: { id?: string; text: string } | undefined;

  // Check if this is a MappingSuggestionType (flat structure with direct domain/objective properties)
  // This must be checked FIRST before the nested VideoContentMappingWithHierarchy checks
  const isMappingSuggestion = "domain" in mapping &&
    "objective" in mapping &&
    typeof (mapping as MappingSuggestionType).domain === "object" &&
    typeof (mapping as MappingSuggestionType).objective === "object";

  if (isMappingSuggestion) {
    // MappingSuggestionType (flat structure from AI suggestions)
    domain = (mapping as MappingSuggestionType).domain;
    objective = (mapping as MappingSuggestionType).objective;
    bullet = (mapping as MappingSuggestionType).bullet;
    subBullet = (mapping as MappingSuggestionType).subBullet;
  } else if ("subBulletId" in mapping && mapping.subBulletId && mapping.subBullet) {
    // VideoContentMappingWithHierarchy with sub-bullet (nested structure)
    domain = mapping.subBullet.bullet.objective.domain;
    objective = mapping.subBullet.bullet.objective;
    bullet = mapping.subBullet.bullet;
    subBullet = mapping.subBullet;
  } else if ("bulletId" in mapping && mapping.bulletId && mapping.bullet) {
    // VideoContentMappingWithHierarchy with bullet (nested structure)
    domain = mapping.bullet.objective.domain;
    objective = mapping.bullet.objective;
    bullet = mapping.bullet;
  } else if ("objectiveId" in mapping && mapping.objectiveId && mapping.objective) {
    // VideoContentMappingWithHierarchy with objective only (nested structure)
    domain = mapping.objective.domain;
    objective = mapping.objective;
  } else {
    // Fallback - should not reach here if types are correct
    domain = { id: "", name: "Unknown" };
    objective = { id: "", code: "??", description: "Unknown mapping type" };
  }

  return (
    <div className="space-y-1 text-sm">
      {/* Domain */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Domain
        </Badge>
        <span className="text-muted-foreground">{domain.name}</span>
      </div>

      {/* Objective */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {objective.code}
        </Badge>
        <span className="line-clamp-1" title={objective.description}>
          {objective.description}
        </span>
      </div>

      {/* Bullet (if exists) */}
      {bullet && (
        <div className="ml-4 flex items-start gap-2">
          <span className="text-muted-foreground">→</span>
          <span className="line-clamp-2" title={bullet.text}>
            {bullet.text}
          </span>
        </div>
      )}

      {/* Sub-bullet (if exists) */}
      {subBullet && (
        <div className="ml-8 flex items-start gap-2">
          <span className="text-muted-foreground">→</span>
          <span className="line-clamp-2" title={subBullet.text}>
            {subBullet.text}
          </span>
        </div>
      )}

      {/* Confidence badge */}
      {showConfidence && confidence !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant={
              confidence >= 0.9
                ? "default"
                : confidence >= 0.7
                  ? "secondary"
                  : "outline"
            }
            className="text-xs"
          >
            {confidence >= 0.9 ? "🟢" : "🟡"} {Math.round(confidence * 100)}%
            confidence
          </Badge>
        </div>
      )}
    </div>
  );
}
