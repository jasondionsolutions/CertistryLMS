// modules/shared/names/types/names.types.ts
// PORTED FROM CERTISTRY-APP - FULL CODE

import { z } from "zod";
import type { Gender, Popularity } from "@prisma/client";

// Zod schemas for validation
export const createNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  gender: z.enum(["male", "female", "neutral"]),
  popularity: z.enum(["common", "uncommon", "rare"])
});

export const nameFiltersSchema = z.object({
  gender: z.enum(["male", "female", "neutral"]).optional(),
  popularity: z.enum(["common", "uncommon", "rare"]).optional(),
  limit: z.number().min(1).max(100).default(1)
}).optional();

// TypeScript types
export type CreateNameInput = z.infer<typeof createNameSchema>;
export type NameFilters = z.infer<typeof nameFiltersSchema>;

export interface SerializedName {
  id: string;
  name: string;
  gender: Gender;
  popularity: Popularity;
  createdAt: string;
  updatedAt: string;
}

export interface BulkCreateNameInput {
  names: Array<{
    name: string;
    gender: Gender;
    popularity: Popularity;
  }>;
}

export interface NameStats {
  totalNames: number;
  genderCounts: Record<Gender, number>;
  popularityCounts: Record<Popularity, number>;
}
