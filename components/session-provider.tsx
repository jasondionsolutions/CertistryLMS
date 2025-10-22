// components/session-provider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Client-side SessionProvider wrapper for NextAuth.js
 *
 * This component wraps the app to provide session context to all client components.
 * Must be a client component ("use client") because it uses React Context.
 *
 * Usage:
 * - Wrap your app in this provider (done in root layout)
 * - Access session in client components with useSession() hook
 *
 * Example:
 * ```tsx
 * import { useSession } from 'next-auth/react';
 *
 * function MyComponent() {
 *   const { data: session, status } = useSession();
 *
 *   if (status === 'loading') return <div>Loading...</div>;
 *   if (status === 'unauthenticated') return <div>Please sign in</div>;
 *
 *   return <div>Welcome, {session.user.name}!</div>;
 * }
 * ```
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
