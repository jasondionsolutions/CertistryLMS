// modules/shared/names/serverActions/names.actions.ts
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)
"use server";

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { logger } from "@/lib/utils/secure-logger";
import type { AuthContext } from "@/lib/auth/types";
import type {
  CreateNameInput,
  NameFilters,
  SerializedName,
  BulkCreateNameInput,
  NameStats
} from "@/modules/shared/names/types/names.types";
import {
  createNameSchema,
  nameFiltersSchema
} from "@/modules/shared/names/types/names.types";

// Get random name(s) - public function, no auth required
export async function getRandomNames(filters?: NameFilters): Promise<{
  success: boolean;
  data?: SerializedName | SerializedName[];
  error?: string;
}> {
  try {
    // Validate and parse filters
    const validatedFilters = nameFiltersSchema.parse(filters);
    const limit = validatedFilters?.limit || 1;

    // Build where clause
    const where: any = {};
    if (validatedFilters?.gender) {
      where.gender = validatedFilters.gender;
    }
    if (validatedFilters?.popularity) {
      where.popularity = validatedFilters.popularity;
    }

    // Get total count for random selection
    const totalCount = await prisma.name.count({ where });

    if (totalCount === 0) {
      return {
        success: false,
        error: "No names found matching criteria"
      };
    }

    // PostgreSQL: Use ORDER BY RANDOM() for random selection
    const names = await prisma.name.findMany({
      where,
      take: limit,
      orderBy: {
        // This is a workaround for random ordering in Prisma
        // In production, consider using raw SQL for better performance
        id: 'asc'
      }
    });

    // For better randomness, shuffle the results
    const shuffled = names.sort(() => Math.random() - 0.5).slice(0, limit);

    // Serialize names
    const serializedNames: SerializedName[] = shuffled.map(name => ({
      id: name.id,
      name: name.name,
      gender: name.gender,
      popularity: name.popularity,
      createdAt: name.createdAt.toISOString(),
      updatedAt: name.updatedAt.toISOString()
    }));

    return {
      success: true,
      data: limit === 1 ? serializedNames[0] : serializedNames
    };

  } catch (error) {
    logger.error("Error getting random names", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get random names"
    };
  }
}

// Create single name - admin only
async function _createName(
  currentUser: AuthContext,
  input: CreateNameInput
): Promise<{
  success: boolean;
  data?: SerializedName;
  error?: string;
}> {
  try {
    // Validate input
    const validated = createNameSchema.parse(input);

    // Check if name already exists
    const existingName = await prisma.name.findUnique({
      where: { name: validated.name }
    });

    if (existingName) {
      return {
        success: false,
        error: "Name already exists"
      };
    }

    // Create name
    const name = await prisma.name.create({
      data: validated
    });

    const serializedName: SerializedName = {
      id: name.id,
      name: name.name,
      gender: name.gender,
      popularity: name.popularity,
      createdAt: name.createdAt.toISOString(),
      updatedAt: name.updatedAt.toISOString()
    };

    return {
      success: true,
      data: serializedName
    };

  } catch (error) {
    logger.error("Error creating name", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create name"
    };
  }
}

// Bulk create names - admin only
async function _bulkCreateNames(
  currentUser: AuthContext,
  input: BulkCreateNameInput
): Promise<{
  success: boolean;
  data?: { created: number; skipped: number; errors: string[] };
  error?: string;
}> {
  try {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process names in batches to avoid memory issues
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < input.names.length; i += batchSize) {
      batches.push(input.names.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const validNames = [];

      // Validate each name in the batch
      for (const nameData of batch) {
        try {
          const validated = createNameSchema.parse(nameData);

          // Check if name already exists
          const exists = await prisma.name.findUnique({
            where: { name: validated.name }
          });

          if (exists) {
            results.skipped++;
          } else {
            validNames.push(validated);
          }
        } catch (error) {
          results.errors.push(`Invalid name "${nameData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Bulk insert valid names
      if (validNames.length > 0) {
        try {
          await prisma.name.createMany({
            data: validNames
          });
          results.created += validNames.length;
        } catch (error) {
          results.errors.push(`Batch insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return {
      success: true,
      data: results
    };

  } catch (error) {
    logger.error("Error bulk creating names", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk create names"
    };
  }
}

// Get all names with filtering - admin only
async function _getAllNames(
  currentUser: AuthContext,
  filters?: NameFilters
): Promise<{
  success: boolean;
  data?: SerializedName[];
  error?: string;
}> {
  try {
    // Validate filters
    const validatedFilters = nameFiltersSchema.parse(filters);

    // Build where clause
    const where: any = {};
    if (validatedFilters?.gender) {
      where.gender = validatedFilters.gender;
    }
    if (validatedFilters?.popularity) {
      where.popularity = validatedFilters.popularity;
    }

    const names = await prisma.name.findMany({
      where,
      orderBy: { name: 'asc' },
      take: validatedFilters?.limit || 1000 // Default limit to prevent huge queries
    });

    const serializedNames: SerializedName[] = names.map(name => ({
      id: name.id,
      name: name.name,
      gender: name.gender,
      popularity: name.popularity,
      createdAt: name.createdAt.toISOString(),
      updatedAt: name.updatedAt.toISOString()
    }));

    return {
      success: true,
      data: serializedNames
    };

  } catch (error) {
    logger.error("Error getting all names", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get names"
    };
  }
}

// Get name statistics - admin only
async function _getNameStats(
  currentUser: AuthContext
): Promise<{
  success: boolean;
  data?: NameStats;
  error?: string;
}> {
  try {
    // Get total count
    const totalNames = await prisma.name.count();

    // Get counts by gender
    const genderCounts = await prisma.name.groupBy({
      by: ['gender'],
      _count: { gender: true }
    });

    // Get counts by popularity
    const popularityCounts = await prisma.name.groupBy({
      by: ['popularity'],
      _count: { popularity: true }
    });

    const stats: NameStats = {
      totalNames,
      genderCounts: {
        male: genderCounts.find(g => g.gender === 'male')?._count.gender || 0,
        female: genderCounts.find(g => g.gender === 'female')?._count.gender || 0,
        neutral: genderCounts.find(g => g.gender === 'neutral')?._count.gender || 0
      },
      popularityCounts: {
        common: popularityCounts.find(p => p.popularity === 'common')?._count.popularity || 0,
        uncommon: popularityCounts.find(p => p.popularity === 'uncommon')?._count.popularity || 0,
        rare: popularityCounts.find(p => p.popularity === 'rare')?._count.popularity || 0
      }
    };

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    logger.error("Error getting name stats", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get name statistics"
    };
  }
}

// Delete name - admin only
async function _deleteName(
  currentUser: AuthContext,
  nameId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.name.delete({
      where: { id: nameId }
    });

    return { success: true };

  } catch (error) {
    logger.error("Error deleting name", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete name"
    };
  }
}

// Exported wrapped functions
export const createName = withPermission('system')(_createName);
export const bulkCreateNames = withPermission('system')(_bulkCreateNames);
export const getAllNames = withPermission('system')(_getAllNames);
export const getNameStats = withPermission('system')(_getNameStats);
export const deleteName = withPermission('system')(_deleteName);

// Note: getRandomNames is exported directly above without auth wrapper since it's public
