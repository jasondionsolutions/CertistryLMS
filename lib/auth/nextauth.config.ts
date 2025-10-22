// lib/auth/nextauth.config.ts
import { NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth.js configuration with AWS Cognito provider
 *
 * This handles:
 * - OAuth authentication flow with Cognito
 * - User synchronization with local database
 * - Role mapping from Cognito custom attributes
 * - Session management
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET || "", // Optional for public clients
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,

      // Request custom attributes from Cognito
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],

  // Callback URLs configuration
  callbacks: {
    /**
     * JWT callback - runs whenever a JWT is created or updated
     * Enriches token with user ID and role from Cognito
     */
    async jwt({ token, account, profile }) {
      // On initial sign-in, sync user with database
      if (account && profile) {
        try {
          // Extract roles from Cognito groups
          const profileData = profile as Record<string, unknown>;

          // Cognito groups are in "cognito:groups" claim
          const cognitoGroups = (profileData["cognito:groups"] as string[]) || [];

          // Map Cognito groups to roles (groups like "admin", "user", "instructor")
          // If user is in multiple groups, keep all of them
          // Default to "user" role if no groups assigned
          const roles = cognitoGroups.length > 0 ? cognitoGroups : ["user"];

          // Sync user with database - handle both new and existing users
          // First, try to find user by cognitoId OR email
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { cognitoId: profile.sub },
                { email: token.email! }
              ]
            }
          });

          if (user) {
            // Update existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                email: token.email!,
                name: token.name,
                cognitoId: profile.sub, // Update cognitoId in case it changed
                cognitoUsername: (profileData.username as string) || (profileData["cognito:username"] as string),
                roles: roles,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: token.email!,
                name: token.name,
                cognitoId: profile.sub,
                cognitoUsername: (profileData.username as string) || (profileData["cognito:username"] as string),
                roles: roles,
              },
            });
          }

          // Add user ID and role to token
          token.userId = user.id;
          token.roles = user.roles;
        } catch (error) {
          console.error("Error syncing user with database:", error);
        }
      }

      return token;
    },

    /**
     * Session callback - runs whenever session is checked
     * Adds user data to the session object
     */
    async session({ session, token }) {
      if (session.user) {
        // Attach user ID and roles to session
        const user = session.user as Record<string, unknown>;
        user.id = token.userId as string;
        user.roles = token.roles as string[];
      }

      return session;
    },

    /**
     * Redirect callback - controls where users are redirected after sign-in
     * Homepage will handle role-based redirect to /admin or /dashboard
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Redirect to homepage, which will redirect based on role
      return baseUrl;
    },
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",

  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
};
