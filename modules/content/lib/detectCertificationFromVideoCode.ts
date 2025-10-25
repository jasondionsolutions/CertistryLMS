/**
 * Detect Certification from Video Code
 *
 * Derives which certification a video belongs to based on its video code.
 * Uses database-stored videoCodePrefix patterns instead of hardcoded patterns.
 * Admins can manage these patterns via certification management UI.
 */

import { prisma } from "@/lib/prisma";

/**
 * Detect and fetch full certification from video code
 * Queries database for certifications with matching videoCodePrefix
 * Returns the certification entity if found
 */
export async function detectCertificationFromVideoCode(
  videoCode: string | null | undefined
): Promise<{ id: string; name: string; code: string } | null> {
  if (!videoCode || videoCode.trim().length === 0) {
    return null;
  }

  const trimmed = videoCode.trim().toUpperCase();

  // Get all active certifications with video code prefixes
  const certifications = await prisma.certification.findMany({
    where: {
      videoCodePrefix: { not: null },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      videoCodePrefix: true,
    },
    orderBy: {
      // Longer prefixes first (more specific matches)
      videoCodePrefix: 'desc',
    },
  });

  // Find the first certification where videoCode starts with the prefix (case-insensitive)
  for (const cert of certifications) {
    if (cert.videoCodePrefix) {
      const prefix = cert.videoCodePrefix.toUpperCase();
      if (trimmed.startsWith(prefix)) {
        return {
          id: cert.id,
          name: cert.name,
          code: cert.code,
        };
      }
    }
  }

  return null;
}

/**
 * Get all certification video code patterns from database
 * Used for displaying available patterns in UI
 */
export async function getCertificationVideoCodePatterns(): Promise<
  Array<{
    certificationId: string;
    certificationName: string;
    certificationCode: string;
    videoCodePrefix: string;
  }>
> {
  const certifications = await prisma.certification.findMany({
    where: {
      videoCodePrefix: { not: null },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      videoCodePrefix: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return certifications.map((cert) => ({
    certificationId: cert.id,
    certificationName: cert.name,
    certificationCode: cert.code,
    videoCodePrefix: cert.videoCodePrefix!,
  }));
}
