// lib/auth/validateSession.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth.config";
import { AuthContext, UnauthorizedError } from "./types";
import { prisma } from "@/lib/prisma";

/**
 * Permission mapping based on user roles
 *
 * This defines what permissions each role has access to.
 * Customize this based on your application's needs.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    // General permissions
    "read",
    "write",
    "delete",

    // User management
    "users.manage",
    "users.create",
    "users.update",
    "users.delete",
    "users.read",

    // Certification management
    "certifications.read",
    "certifications.create",
    "certifications.update",
    "certifications.delete",
    "certifications.manage",

    // AI Models management
    "ai_models.read",
    "ai_models.create",
    "ai_models.update",
    "ai_models.delete",
    "ai_models.manage",

    // Content management
    "content.read",
    "content.create",
    "content.update",
    "content.delete",
    "content.manage",

    // Analytics
    "analytics.view",
    "analytics.manage",
  ],
  instructor: [
    // General permissions
    "read",
    "write",

    // Certification access
    "certifications.read",
    "certifications.create",
    "certifications.update",

    // Content management
    "content.read",
    "content.create",
    "content.update",
    "content.edit",

    // Student management
    "students.view",
    "students.read",

    // Analytics
    "analytics.view",
  ],
  user: [
    // Basic read access
    "read",

    // Content viewing
    "content.view",
    "content.read",

    // Own progress management
    "progress.manage",
    "progress.read",
    "progress.update",
  ],
};

/**
 * Validates the current session and returns the auth context.
 *
 * This function:
 * 1. Gets session from NextAuth (validates JWT)
 * 2. Verifies user exists in database
 * 3. Enriches context with roles and permissions
 * 4. Returns AuthContext for use in server actions
 *
 * @returns {Promise<AuthContext>} The authenticated user context
 * @throws {UnauthorizedError} If authentication fails
 */
export async function validateSession(): Promise<AuthContext> {
  // Get session from NextAuth
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError("Authentication required");
  }

  // Get user ID from session
  const sessionUser = session.user as Record<string, unknown>;
  const userId = sessionUser.id as string;
  if (!userId) {
    throw new UnauthorizedError("Invalid session - missing user ID");
  }

  // Fetch user from database to get latest roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  // Map roles to permissions
  const permissions = new Set<string>();
  user.roles.forEach((role: string) => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach((perm: string) => permissions.add(perm));
  });

  // Build and return AuthContext
  const authContext: AuthContext = {
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
    roles: user.roles,
    permissions: Array.from(permissions),
  };

  return authContext;
}

/**
 * Get current session without throwing error
 *
 * Useful for optional authentication (e.g., public pages that show different content for logged-in users)
 *
 * @returns {Promise<AuthContext | null>} Auth context or null if not authenticated
 */
export async function getOptionalSession(): Promise<AuthContext | null> {
  try {
    return await validateSession();
  } catch {
    return null;
  }
}
