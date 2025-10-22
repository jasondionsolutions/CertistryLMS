// hooks/useAuth.ts
"use client";

import { useSession } from "next-auth/react";

/**
 * Custom auth hook that wraps NextAuth's useSession
 * Provides a cleaner, type-safe API for accessing user authentication state
 *
 * @example
 * ```tsx
 * const { user, roles, isAuthenticated, isLoading } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 *
 * return <div>Hello {user.name}</div>;
 * ```
 */
export function useAuth() {
  const { data: session, status } = useSession();

  // Extract user data with proper typing
  const user = session?.user as
    | {
        id: string;
        email: string;
        name?: string;
        roles: string[];
      }
    | undefined;

  return {
    // User data
    user: user || null,
    userId: user?.id || null,
    email: user?.email || null,
    name: user?.name || null,
    roles: user?.roles || [],

    // Auth state
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",

    // Role helpers
    isAdmin: user?.roles?.includes("admin") || false,
    isInstructor: user?.roles?.includes("instructor") || false,
    isUser: user?.roles?.includes("user") || false,

    // Check if user has specific role
    hasRole: (role: string) => user?.roles?.includes(role) || false,

    // Check if user has any of the specified roles
    hasAnyRole: (roles: string[]) =>
      roles.some((role) => user?.roles?.includes(role)) || false,

    // Check if user has all of the specified roles
    hasAllRoles: (roles: string[]) =>
      roles.every((role) => user?.roles?.includes(role)) || false,

    // Original session data (for advanced use cases)
    session,
    status,
  };
}
