"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { withAccess } from "@/lib/middleware/withAccess";
import { AuthContext } from "@/lib/auth/types";
import {
  submitNameSchema,
  type SubmitNameInput,
  type SubmitNameResponse,
} from "../types/visitor.schema";

/**
 * Server action to submit and save visitor name to cookie
 * Uses withAccess middleware for basic authentication
 */
export const submitName = withAccess(
  async (
    user: AuthContext,
    formData: FormData
  ): Promise<SubmitNameResponse> => {
    try {
      // Extract and validate input
      const rawName = formData.get("name")?.toString();
      const validated = submitNameSchema.parse({ name: rawName });

      // Save to cookie (24 hours expiry)
      (await cookies()).set("visitor_name", validated.name, {
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      // Revalidate the home page
      revalidatePath("/");

      return {
        success: true,
        data: { name: validated.name },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }
);

/**
 * Server action to get the current visitor name from cookie
 */
export const getVisitorName = withAccess(
  async (user: AuthContext): Promise<string | null> => {
    const cookieStore = await cookies();
    return cookieStore.get("visitor_name")?.value || null;
  }
);
