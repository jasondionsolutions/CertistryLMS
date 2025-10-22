// app/unauthorized/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthButtonSkeleton } from "@/components/skeletons/auth-skeletons";

/**
 * Unauthorized access page
 * Displays when user tries to access a page they don't have permission for
 */
export default function UnauthorizedPage() {
  const { user, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-20 sm:px-10 grid place-items-center bg-background text-foreground">
        <div className="w-full max-w-md space-y-8 text-center">
          <AuthButtonSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 grid place-items-center bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Unauthorized Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-500/10 p-6">
            <svg
              className="h-16 w-16 text-yellow-600 dark:text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Access Denied
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            You don&apos;t have permission to access this page.
          </p>

          {user && (
            <div className="bg-muted/40 border rounded-lg px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Current user: <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <p className="text-muted-foreground mt-1">
                Your roles:{" "}
                <span className="font-medium text-foreground">
                  {roles.length > 0 ? roles.join(", ") : "None"}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Dashboard
            </a>

            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to homepage
            </a>
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t text-sm text-muted-foreground space-y-2">
          <p>Need access to this page?</p>
          <p>
            Contact your administrator at{" "}
            <a
              href="mailto:admin@certistry.com"
              className="text-primary hover:underline"
            >
              admin@certistry.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
