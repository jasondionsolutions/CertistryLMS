// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js Middleware for route protection
 *
 * This middleware runs BEFORE pages load, protecting routes at the server level.
 * It prevents unauthorized users from accessing protected routes and ensures
 * proper redirects based on authentication status and roles.
 *
 * Protected routes:
 * - /dashboard/* - Students/users
 * - /admin/* - Admins and instructors only
 *
 * Public routes:
 * - / (homepage)
 * - /api/auth/* (NextAuth routes)
 * - /auth/* (Auth error pages)
 * - /unauthorized (Permission denied page)
 */

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - require admin or instructor role
    if (path.startsWith("/admin")) {
      const roles = (token?.roles as string[]) || [];
      const isAuthorized = roles.includes("admin") || roles.includes("instructor");

      if (!isAuthorized) {
        // Redirect non-admin/instructor users to their dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Student dashboard routes - all authenticated users can access
    if (path.startsWith("/dashboard")) {
      // Already authenticated by the authorized callback
      // Allow access
      return NextResponse.next();
    }

    // Allow access to other routes
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if middleware should run
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes - no auth required
        if (
          path === "/" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/auth/") ||
          path === "/unauthorized"
        ) {
          return true;
        }

        // Protected routes - require authentication
        if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
          if (!token) {
            // Redirect to unauthorized page instead of sign-in
            return false;
          }
          return true;
        }

        // Default: allow access
        return true;
      },
    },
    pages: {
      signIn: "/unauthorized", // Redirect to unauthorized page if not authenticated
    },
  }
);

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
