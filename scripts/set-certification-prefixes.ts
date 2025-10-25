/**
 * Set Certification Video Code Prefixes
 *
 * Sets videoCodePrefix for existing certifications based on common patterns.
 * Run once after adding videoCodePrefix field.
 *
 * Usage: npx tsx scripts/set-certification-prefixes.ts
 */

import { prisma } from "../lib/prisma";

// Common certification patterns
const KNOWN_PATTERNS: Record<string, string> = {
  "AIF-001": "AISF",
  "SY0-701": "SY7",
  "CISSP": "CISSP",
  "CEH": "CEH",
  "CCNA": "CCNA",
  "AWS-SAA": "AWS",
  "AZ-104": "AZURE",
};

async function main() {
  console.log("\n🔧 Setting video code prefixes for certifications...\n");

  const certifications = await prisma.certification.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      videoCodePrefix: true,
    },
  });

  console.log(`📚 Found ${certifications.length} certifications\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const cert of certifications) {
    // Skip if already has prefix
    if (cert.videoCodePrefix) {
      console.log(
        `⏭️  Skipped: ${cert.name} - already has prefix "${cert.videoCodePrefix}"`
      );
      skippedCount++;
      continue;
    }

    // Check if we have a known pattern for this certification code
    const prefix = KNOWN_PATTERNS[cert.code];

    if (prefix) {
      await prisma.certification.update({
        where: { id: cert.id },
        data: { videoCodePrefix: prefix },
      });

      console.log(`✅ Updated: ${cert.name} (${cert.code}) → "${prefix}"`);
      updatedCount++;
    } else {
      console.log(
        `⚠️  Skipped: ${cert.name} (${cert.code}) - no known pattern (can be set manually in UI)`
      );
      skippedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total certifications: ${certifications.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped: ${skippedCount}`);

  if (updatedCount > 0) {
    console.log(
      `\n✨ Successfully set video code prefixes for ${updatedCount} certification(s)!`
    );
  }

  if (skippedCount > 0) {
    console.log(
      `\n💡 Tip: You can set video code prefixes for other certifications in the certification management UI.`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
