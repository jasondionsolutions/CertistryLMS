// lib/middleware/withAccess.ts
import { validateSession } from "@/lib/auth/validateSession";
import { AuthContext, UnauthorizedError } from "@/lib/auth/types";

/**
 * Basic access control middleware for server actions.
 * Validates that the user is authenticated.
 *
 * Use this as a starting point for new server actions when full RBAC
 * mapping is not yet finalized.
 *
 * @example
 * ```typescript
 * export const createBook = withAccess(async (
 *   user: AuthContext,
 *   input: CreateBookInput
 * ) => {
 *   const book = await prisma.book.create({
 *     data: { ...input, createdById: user.userId }
 *   });
 *   return { data: book, success: true };
 * });
 * ```
 */
export function withAccess<Args extends any[], R>(
  actionFn: (user: AuthContext, ...args: Args) => Promise<R>
) {
  return async (...args: Args): Promise<R> => {
    const user = await validateSession();

    if (!user?.userId) {
      throw new UnauthorizedError("Authentication required");
    }

    return actionFn(user, ...args);
  };
}
