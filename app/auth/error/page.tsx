// app/auth/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";

/**
 * Authentication error page
 * Displays user-friendly error messages when authentication fails
 */

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map NextAuth error codes to user-friendly messages
  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Server Configuration Error",
      description:
        "There is a problem with the server configuration. Please contact support.",
    },
    AccessDenied: {
      title: "Access Denied",
      description:
        "You do not have permission to sign in. Please contact an administrator.",
    },
    Verification: {
      title: "Verification Failed",
      description:
        "The verification token has expired or has already been used. Please try signing in again.",
    },
    OAuthSignin: {
      title: "OAuth Sign-In Error",
      description:
        "There was an error starting the OAuth sign-in process. Please try again.",
    },
    OAuthCallback: {
      title: "OAuth Callback Error",
      description:
        "There was an error during the OAuth callback. Please try signing in again.",
    },
    OAuthCreateAccount: {
      title: "Account Creation Error",
      description:
        "Could not create an account with the OAuth provider. Please try again or contact support.",
    },
    EmailCreateAccount: {
      title: "Email Account Creation Error",
      description:
        "Could not create an email account. Please try again or contact support.",
    },
    Callback: {
      title: "Callback Error",
      description:
        "There was an error during the authentication callback. Please try signing in again.",
    },
    OAuthAccountNotLinked: {
      title: "Account Not Linked",
      description:
        "This email is already associated with another account. Please sign in with your original authentication method.",
    },
    SessionRequired: {
      title: "Session Required",
      description: "You must be signed in to access this page.",
    },
    Default: {
      title: "Authentication Error",
      description:
        "An unexpected authentication error occurred. Please try again or contact support.",
    },
  };

  const errorInfo = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 grid place-items-center bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <svg
              className="h-16 w-16 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {errorInfo.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {errorInfo.description}
          </p>
          {error && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded">
              Error code: {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <AuthButton />

          <div className="text-sm text-muted-foreground">
            <a
              href="/"
              className="text-primary hover:underline font-medium"
            >
              ← Back to homepage
            </a>
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t text-sm text-muted-foreground">
          <p>
            If this problem persists, please contact{" "}
            <a
              href="mailto:support@certistry.com"
              className="text-primary hover:underline"
            >
              support@certistry.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
