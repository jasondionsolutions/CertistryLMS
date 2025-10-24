import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixStuckVideos() {
  // Find videos stuck in "processing" for more than 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const stuckVideos = await prisma.video.findMany({
    where: {
      transcriptionStatus: "processing",
      updatedAt: {
        lt: tenMinutesAgo,
      },
    },
  });

  console.log(`Found ${stuckVideos.length} stuck videos`);

  for (const video of stuckVideos) {
    console.log(`Resetting video ${video.id} (${video.title})`);
    await prisma.video.update({
      where: { id: video.id },
      data: {
        transcriptionStatus: "failed",
        transcriptionError: "Worker timeout - video processing took too long. Please retry or upload a shorter video.",
        isProcessed: true,
      },
    });
  }

  console.log("✅ Done!");
}

fixStuckVideos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
