// lib/middleware/withRole.ts
import { validateSession } from "@/lib/auth/validateSession";
import { AuthContext, PermissionError } from "@/lib/auth/types";

/**
 * Checks if user has required role(s)
 */
function checkRoles(userRoles: string[], required: string | string[]): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Role-based access control middleware for server actions.
 * Validates authentication AND required roles.
 *
 * Use this for Cognito role-based protection (admin, instructor, user).
 *
 * @example
 * ```typescript
 * // Only admins can delete files
 * export const deleteFile = withRole('admin')(async (
 *   user: AuthContext,
 *   fileId: string
 * ) => {
 *   await prisma.file.delete({ where: { id: fileId } });
 *   return { success: true };
 * });
 *
 * // Admins OR instructors can upload
 * export const uploadFile = withRole(['admin', 'instructor'])(async (
 *   user: AuthContext,
 *   ...args
 * ) => {
 *   // ... upload logic
 * });
 * ```
 */
export function withRole(required: string | string[]) {
  return <Args extends unknown[], R>(
    actionFn: (user: AuthContext, ...args: Args) => Promise<R>
  ) => {
    return async (...args: Args): Promise<R> => {
      const user = await validateSession();

      const hasRole = checkRoles(user.roles, required);

      if (!hasRole) {
        const requiredRoles = Array.isArray(required) ? required : [required];
        throw new PermissionError(
          `Access denied. Required role(s): ${requiredRoles.join(" or ")}`
        );
      }

      return actionFn(user, ...args);
    };
  };
}
