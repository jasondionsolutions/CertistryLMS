// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton
 *
 * Ensures only one instance of Prisma Client exists across the application
 * This is important for:
 * - Preventing connection pool exhaustion in development (hot reload)
 * - Maintaining consistent database connections
 * - Performance optimization
 *
 * In development: Stores client on globalThis to survive hot reloads
 * In production: Creates a single instance
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Disconnects Prisma Client when the process exits
 */
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
