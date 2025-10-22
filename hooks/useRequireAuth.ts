// hooks/useRequireAuth.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Hook that requires user to be authenticated
 * Auto-redirects to specified page if not logged in
 *
 * @param redirectTo - URL to redirect to if not authenticated (default: "/")
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isLoading } = useRequireAuth();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   // User is guaranteed to be authenticated here
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = "/") {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
