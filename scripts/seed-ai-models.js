/**
 * Seed script to populate initial AI models
 * Run with: node scripts/seed-ai-models.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const AI_MODELS = [
  {
    name: "Claude 3.5 Sonnet (Latest)",
    modelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    description: "Most intelligent model with best performance for blueprint extraction. Recommended for complex exam structures.",
    isActive: true,
  },
  {
    name: "Claude 3.5 Sonnet",
    modelId: "claude-3-5-sonnet-20240620",
    provider: "anthropic",
    description: "Previous version of Claude 3.5 Sonnet. Good balance of speed and accuracy.",
    isActive: true,
  },
  {
    name: "Claude 3 Opus",
    modelId: "claude-3-opus-20240229",
    provider: "anthropic",
    description: "Most capable Claude 3 model. Use for highest accuracy on complex documents.",
    isActive: true,
  },
  {
    name: "Claude 3 Sonnet",
    modelId: "claude-3-sonnet-20240229",
    provider: "anthropic",
    description: "Balanced performance for most blueprint extraction tasks.",
    isActive: true,
  },
  {
    name: "Claude 3 Haiku",
    modelId: "claude-3-haiku-20240307",
    provider: "anthropic",
    description: "Fastest and most cost-effective. Good for simple exam structures.",
    isActive: false,
  },
];

async function main() {
  console.log("🌱 Seeding AI models...");

  for (const model of AI_MODELS) {
    try {
      // Check if model already exists
      const existing = await prisma.aIModel.findUnique({
        where: { modelId: model.modelId },
      });

      if (existing) {
        console.log(`⏭️  Model "${model.name}" already exists, skipping...`);
        continue;
      }

      // Create the model
      await prisma.aIModel.create({
        data: model,
      });

      console.log(`✅ Created AI model: ${model.name}`);
    } catch (error) {
      console.error(`❌ Error creating model "${model.name}":`, error);
    }
  }

  console.log("✨ AI models seeding complete!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
