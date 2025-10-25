/**
 * Generate and cache embeddings for certification content
 *
 * This script generates OpenAI embeddings for all objectives, bullets,
 * and sub-bullets in a certification and stores them in the database.
 *
 * Usage: npx tsx scripts/generate-embeddings.ts [certificationId]
 *
 * Cost: ~$0.01 per certification (one-time)
 *
 * Note: This is run automatically when certifications are created.
 * Use this script to manually regenerate embeddings or fix missing ones.
 */

import { prisma } from "../lib/prisma";
import { generateCertificationEmbeddings } from "../modules/content/services/generateCertificationEmbeddings.service";

async function main() {
  const certificationId = process.argv[2];

  if (!certificationId) {
    console.error("❌ Usage: npx tsx scripts/generate-embeddings.ts <certificationId>");
    console.log("\n📚 Available certifications:");

    const certifications = await prisma.certification.findMany({
      select: { id: true, name: true, code: true },
    });

    if (certifications.length === 0) {
      console.log("  No certifications found in database.");
    } else {
      certifications.forEach((cert) => {
        console.log(`  - ${cert.name} (${cert.code})`);
        console.log(`    ID: ${cert.id}`);
      });
    }

    process.exit(1);
  }

  // Get certification info
  const certification = await prisma.certification.findUnique({
    where: { id: certificationId },
    select: { name: true, code: true },
  });

  if (!certification) {
    console.error(`❌ Certification not found: ${certificationId}`);
    process.exit(1);
  }

  console.log(`\n🚀 Generating embeddings for: ${certification.name} (${certification.code})\n`);

  try {
    const result = await generateCertificationEmbeddings(certificationId);

    if (result.success && result.stats) {
      console.log(`\n🎉 Embedding generation complete!`);
      console.log(`\n📊 Summary:`);
      console.log(`  Domains: ${result.stats.domains} new embeddings`);
      console.log(`  Objectives: ${result.stats.objectives} new embeddings`);
      console.log(`  Bullets: ${result.stats.bullets} new embeddings`);
      console.log(`  Sub-bullets: ${result.stats.subBullets} new embeddings`);
      console.log(
        `  Total: ${result.stats.domains + result.stats.objectives + result.stats.bullets + result.stats.subBullets} new embeddings`
      );

      const total =
        result.stats.domains +
        result.stats.objectives +
        result.stats.bullets +
        result.stats.subBullets;
      const estimatedCost = (total / 1000000) * 0.13;
      console.log(`\n💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
    } else {
      console.error(`\n❌ Failed to generate embeddings: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error generating embeddings:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
