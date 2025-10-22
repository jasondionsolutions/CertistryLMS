// hooks/useRequireRole.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Hook that requires user to have specific role(s)
 * Auto-redirects if user doesn't have the required role
 *
 * @param requiredRole - Single role or array of roles (user needs at least one)
 * @param redirectTo - URL to redirect to if role check fails (default: "/dashboard")
 *
 * @example
 * ```tsx
 * // Require admin role
 * function AdminPanel() {
 *   const { hasRole, isLoading } = useRequireRole("admin");
 *
 *   if (isLoading) return <Spinner />;
 *   if (!hasRole) return null; // Will redirect automatically
 *
 *   return <div>Admin content</div>;
 * }
 *
 * // Require admin OR instructor role
 * function InstructorPanel() {
 *   const { hasRole, isLoading } = useRequireRole(["admin", "instructor"]);
 *
 *   if (isLoading) return <Spinner />;
 *   if (!hasRole) return null;
 *
 *   return <div>Instructor content</div>;
 * }
 * ```
 */
export function useRequireRole(
  requiredRole: string | string[],
  redirectTo: string = "/dashboard"
) {
  const router = useRouter();
  const { roles, isLoading, isAuthenticated, hasRole, hasAnyRole } = useAuth();

  // Determine if user has required role(s)
  const userHasRole = Array.isArray(requiredRole)
    ? hasAnyRole(requiredRole)
    : hasRole(requiredRole);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Redirect if authenticated but missing required role
    if (!userHasRole) {
      router.push(redirectTo);
    }
  }, [userHasRole, isLoading, isAuthenticated, router, redirectTo]);

  return {
    hasRole: userHasRole,
    isLoading,
    isAuthenticated,
    roles,
  };
}
