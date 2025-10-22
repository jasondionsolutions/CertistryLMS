// components/auth-button.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Authentication button component
 *
 * Shows "Sign In" button when unauthenticated
 * Shows "Sign Out" button when authenticated
 *
 * Uses Cognito hosted UI for authentication
 */
export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button disabled variant="outline">
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">{session.user?.name || session.user?.email}</p>
          <p className="text-muted-foreground text-xs">
            {(session.user as any)?.roles?.join(", ") || "user"}
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
      Sign In with Cognito
    </Button>
  );
}
