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
 * - /dashboard/* - Requires authentication
 * - /admin/* - Requires authentication + admin role
 *
 * Public routes:
 * - / (homepage)
 * - /api/auth/* (NextAuth routes)
 */

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - require admin role
    if (path.startsWith("/admin")) {
      const roles = (token?.roles as string[]) || [];
      const isAdmin = roles.includes("admin");

      if (!isAdmin) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Allow access
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if middleware should run
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes - no auth required
        if (path === "/" || path.startsWith("/api/auth")) {
          return true;
        }

        // Protected routes - require auth
        if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
          return !!token; // Only allow if user has a valid token
        }

        // Default: allow access
        return true;
      },
    },
    pages: {
      signIn: "/", // Redirect to homepage for sign-in
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
