import { z } from "zod";

// Zod schema for visitor name submission
export const submitNameSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

export type SubmitNameInput = z.infer<typeof submitNameSchema>;

// Response type
export interface SubmitNameResponse {
  success: boolean;
  data?: {
    name: string;
  };
  error?: string;
}
