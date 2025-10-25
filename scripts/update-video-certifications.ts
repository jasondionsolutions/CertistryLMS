/**
 * Update Video Certifications
 *
 * Detects and updates certificationId for all videos based on their videoCode.
 * Run after adding certificationId field to Video model.
 *
 * Usage: npx tsx scripts/update-video-certifications.ts
 */

import { prisma } from "../lib/prisma";
import { detectCertificationFromVideoCode } from "../modules/content/lib/detectCertificationFromVideoCode";

async function main() {
  console.log("\n🔄 Updating video certifications based on video codes...\n");

  // Get all videos
  const videos = await prisma.video.findMany({
    select: {
      id: true,
      title: true,
      videoCode: true,
      certificationId: true,
    },
  });

  console.log(`📹 Found ${videos.length} videos\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let undetectedCount = 0;

  for (const video of videos) {
    // Skip if already has certification
    if (video.certificationId) {
      console.log(`⏭️  Skipped: "${video.title}" - already has certification`);
      skippedCount++;
      continue;
    }

    // Try to detect certification
    if (!video.videoCode) {
      console.log(
        `⚠️  Skipped: "${video.title}" - no video code to detect from`
      );
      undetectedCount++;
      continue;
    }

    const detected = await detectCertificationFromVideoCode(video.videoCode);

    if (!detected) {
      console.log(
        `❌ Could not detect: "${video.title}" (code: ${video.videoCode})`
      );
      undetectedCount++;
      continue;
    }

    // Update video with detected certification
    await prisma.video.update({
      where: { id: video.id },
      data: { certificationId: detected.id },
    });

    console.log(
      `✅ Updated: "${video.title}" (${video.videoCode}) → ${detected.name}`
    );
    updatedCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total videos: ${videos.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Already had certification: ${skippedCount}`);
  console.log(`  Could not detect: ${undetectedCount}`);

  if (updatedCount > 0) {
    console.log(`\n✨ Successfully updated ${updatedCount} video(s)!`);
  }

  if (undetectedCount > 0) {
    console.log(
      `\n⚠️  ${undetectedCount} video(s) could not be auto-detected. These need manual assignment.`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
