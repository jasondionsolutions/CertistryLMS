// modules/admin/shared/serverActions/admin-auth.action.ts
// Server action for checking admin authentication status
"use server";

import { getOptionalSession } from "@/lib/auth/validateSession";

export interface AdminAuthResult {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role?: string;
}

/**
 * Check if the current user is authenticated and has admin role
 *
 * @param requiredRole - The role required for access (default: 'admin')
 * @returns AdminAuthResult with authentication and authorization status
 */
export async function checkAdminRole(requiredRole: string = 'admin'): Promise<AdminAuthResult> {
  try {
    const session = await getOptionalSession();

    // Not authenticated
    if (!session) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
      };
    }

    // Authenticated but check role
    const hasRequiredRole = session.roles.includes(requiredRole);

    return {
      isAuthenticated: true,
      isAuthorized: hasRequiredRole,
      role: session.roles[0], // Primary role
    };
  } catch {
    return {
      isAuthenticated: false,
      isAuthorized: false,
    };
  }
}
