// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextauth.config";

/**
 * NextAuth.js API route handler
 *
 * This creates all the necessary auth endpoints:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out
 * - /api/auth/callback/cognito - OAuth callback from Cognito
 * - /api/auth/session - Get current session
 * - /api/auth/csrf - CSRF token
 * - /api/auth/providers - List configured providers
 *
 * Usage in components:
 * ```tsx
 * import { signIn, signOut, useSession } from 'next-auth/react';
 *
 * // Sign in
 * await signIn('cognito');
 *
 * // Sign out
 * await signOut();
 *
 * // Get session
 * const { data: session, status } = useSession();
 * ```
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
