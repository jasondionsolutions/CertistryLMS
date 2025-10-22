// components/auth-button.tsx
"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthButtonSkeleton } from "@/components/skeletons/auth-skeletons";

/**
 * Authentication button component
 *
 * Shows "Sign In" button when unauthenticated
 * Shows user info and "Sign Out" button when authenticated
 *
 * Uses Cognito hosted UI for authentication
 */
export function AuthButton() {
  const { user, roles, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthButtonSkeleton />;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">{user.name || user.email}</p>
          <p className="text-muted-foreground text-xs">
            {roles.join(", ") || "user"}
          </p>
        </div>
        <Button onClick={() => signOut()} variant="outline">
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("cognito")} variant="default">
      Sign In
    </Button>
  );
}
