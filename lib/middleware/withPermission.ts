// lib/middleware/withPermission.ts
import { validateSession } from "@/lib/auth/validateSession";
import { AuthContext, Permission, PermissionError } from "@/lib/auth/types";

/**
 * Checks if user has required permission(s)
 */
function checkPermissions(
  userPermissions: string[],
  required: Permission | Permission[]
): boolean {
  const requiredPerms = Array.isArray(required) ? required : [required];
  return requiredPerms.every((perm) => userPermissions.includes(perm));
}

/**
 * Strict RBAC middleware for server actions.
 * Validates authentication AND required permissions.
 *
 * @example
 * ```typescript
 * export const deleteBook = withPermission('books.delete')(async (
 *   user: AuthContext,
 *   bookId: string
 * ) => {
 *   await prisma.book.delete({ where: { id: bookId } });
 *   return { success: true };
 * });
 *
 * // Multiple permissions (user needs ALL of them)
 * export const adminAction = withPermission(['admin', 'books.manage'])(async (
 *   user: AuthContext,
 *   ...args
 * ) => {
 *   // ... admin logic
 * });
 * ```
 */
export function withPermission(required: Permission | Permission[]) {
  return <Args extends any[], R>(
    actionFn: (user: AuthContext, ...args: Args) => Promise<R>
  ) => {
    return async (...args: Args): Promise<R> => {
      const user = await validateSession();

      const hasPermission = checkPermissions(user.permissions, required);

      if (!hasPermission) {
        throw new PermissionError("Insufficient permissions");
      }

      return actionFn(user, ...args);
    };
  };
}
