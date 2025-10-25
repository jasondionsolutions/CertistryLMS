/**
 * Quick script to check database content for debugging
 */

import { prisma } from "../lib/prisma";

async function main() {
  console.log("\n=== Checking Database Content ===\n");

  // Check certifications
  const certifications = await prisma.certification.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          domains: true,
        },
      },
    },
  });

  console.log("📚 Certifications:");
  certifications.forEach((cert) => {
    console.log(`  - ${cert.name} (ID: ${cert.id})`);
    console.log(`    Domains: ${cert._count.domains}`);
  });

  if (certifications.length === 0) {
    console.log("  ❌ No certifications found in database!");
    return;
  }

  // Check first certification's content
  const firstCert = certifications[0];
  console.log(`\n🔍 Checking content for: ${firstCert.name}\n`);

  const domains = await prisma.certificationDomain.findMany({
    where: { certificationId: firstCert.id },
    select: {
      id: true,
      name: true,
      embedding: true,
      _count: {
        select: {
          objectives: true,
        },
      },
    },
  });

  console.log(`📂 Domains (${domains.length}):`);
  domains.forEach((domain) => {
    console.log(`  - ${domain.name}`);
    console.log(`    Objectives: ${domain._count.objectives}`);
    console.log(`    Has embedding: ${domain.embedding ? "✅" : "❌"}`);
  });

  const objectives = await prisma.certificationObjective.findMany({
    where: {
      domain: { certificationId: firstCert.id },
    },
    select: {
      id: true,
      code: true,
      description: true,
      embedding: true,
      _count: {
        select: {
          bullets: true,
        },
      },
    },
    take: 5,
  });

  console.log(`\n🎯 Sample Objectives (showing ${objectives.length}):`);
  objectives.forEach((obj) => {
    console.log(`  - ${obj.code}: ${obj.description.slice(0, 60)}...`);
    console.log(`    Bullets: ${obj._count.bullets}`);
    console.log(`    Has embedding: ${obj.embedding ? "✅" : "❌"}`);
  });

  const bullets = await prisma.bullet.findMany({
    where: {
      objective: {
        domain: { certificationId: firstCert.id },
      },
    },
    select: {
      id: true,
      text: true,
      embedding: true,
      _count: {
        select: {
          subBullets: true,
        },
      },
    },
    take: 5,
  });

  console.log(`\n📝 Sample Bullets (showing ${bullets.length}):`);
  bullets.forEach((bullet) => {
    console.log(`  - ${bullet.text.slice(0, 60)}...`);
    console.log(`    Sub-bullets: ${bullet._count.subBullets}`);
    console.log(`    Has embedding: ${bullet.embedding ? "✅" : "❌"}`);
  });

  const subBullets = await prisma.subBullet.findMany({
    where: {
      bullet: {
        objective: {
          domain: { certificationId: firstCert.id },
        },
      },
    },
    select: {
      id: true,
      text: true,
      embedding: true,
    },
    take: 5,
  });

  console.log(`\n📋 Sample Sub-bullets (showing ${subBullets.length}):`);
  subBullets.forEach((subBullet) => {
    console.log(`  - ${subBullet.text.slice(0, 60)}...`);
    console.log(`    Has embedding: ${subBullet.embedding ? "✅" : "❌"}`);
  });

  // Check videos
  const videos = await prisma.video.findMany({
    select: {
      id: true,
      title: true,
      transcriptionStatus: true,
      transcript: true,
    },
    take: 5,
  });

  console.log(`\n🎬 Videos (showing ${videos.length}):`);
  videos.forEach((video) => {
    console.log(`  - ${video.title}`);
    console.log(`    ID: ${video.id}`);
    console.log(`    Transcription: ${video.transcriptionStatus}`);
    console.log(
      `    Has transcript: ${video.transcript ? `✅ (${video.transcript.length} chars)` : "❌"}`
    );
  });

  console.log("\n=== Summary ===");
  console.log(
    `Total certifications: ${certifications.length}`
  );
  console.log(`Total domains: ${domains.length}`);
  console.log(`Total objectives: ${objectives.length}`);
  console.log(`Total bullets: ${bullets.length}`);
  console.log(`Total sub-bullets: ${subBullets.length}`);
  console.log(`Total videos: ${videos.length}`);

  const embeddedCount = {
    objectives: objectives.filter((o) => o.embedding).length,
    bullets: bullets.filter((b) => b.embedding).length,
    subBullets: subBullets.filter((sb) => sb.embedding).length,
  };

  console.log(`\n⚠️  Embeddings Status:`);
  console.log(`  Objectives with embeddings: ${embeddedCount.objectives}/${objectives.length}`);
  console.log(`  Bullets with embeddings: ${embeddedCount.bullets}/${bullets.length}`);
  console.log(`  Sub-bullets with embeddings: ${embeddedCount.subBullets}/${subBullets.length}`);

  if (
    embeddedCount.objectives === 0 &&
    embeddedCount.bullets === 0 &&
    embeddedCount.subBullets === 0
  ) {
    console.log(
      `\n❌ No embeddings found! AI suggestions will not work until embeddings are generated.`
    );
    console.log(`   This is the root cause of the "no suggestions found" issue.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
