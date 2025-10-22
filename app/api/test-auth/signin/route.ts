// app/api/test-auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Test-only authentication bypass
 *
 * THIS ENDPOINT ONLY WORKS IN TEST/DEVELOPMENT MODE
 * It allows tests to authenticate without going through Cognito
 *
 * NEVER enable this in production!
 */

export async function POST(request: NextRequest) {
  // SECURITY: Only allow in test/development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Find or create test user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create test user
      user = await prisma.user.create({
        data: {
          email,
          name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          cognitoId: `test-${role}-${Date.now()}`,
          cognitoUsername: email,
          roles: [role],
        },
      });
    }

    // Return user data for the test to use
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
