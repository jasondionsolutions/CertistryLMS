// lib/auth/jwt.verify.ts
import { CognitoJwtVerifier } from "aws-jwt-verify";

/**
 * JWT verification utilities for AWS Cognito tokens
 *
 * This module provides methods to verify:
 * - Access tokens (for API authorization)
 * - ID tokens (for user identity)
 *
 * Uses aws-jwt-verify library which:
 * - Automatically downloads and caches JWK keys from Cognito
 * - Verifies token signature
 * - Validates token expiration
 * - Validates token issuer and audience
 */

// Create verifier for Access Tokens (used for authorization)
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  tokenUse: "access",
});

// Create verifier for ID Tokens (used for user identity)
const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  tokenUse: "id",
});

/**
 * Verify Cognito Access Token
 *
 * Access tokens are used for authorization (checking permissions)
 * They contain scopes and groups
 *
 * @param token - JWT access token from Authorization header
 * @returns Verified token payload
 * @throws Error if token is invalid, expired, or signature doesn't match
 */
export async function verifyAccessToken(token: string) {
  try {
    const payload = await accessTokenVerifier.verify(token);
    return payload;
  } catch (error) {
    console.error("Access token verification failed:", error);
    throw new Error("Invalid access token");
  }
}

/**
 * Verify Cognito ID Token
 *
 * ID tokens contain user identity information (email, name, custom attributes)
 * Use this when you need user profile data
 *
 * @param token - JWT ID token
 * @returns Verified token payload with user attributes
 * @throws Error if token is invalid, expired, or signature doesn't match
 */
export async function verifyIdToken(token: string) {
  try {
    const payload = await idTokenVerifier.verify(token);
    return payload;
  } catch (error) {
    console.error("ID token verification failed:", error);
    throw new Error("Invalid ID token");
  }
}

/**
 * Extract user information from verified ID token
 *
 * @param token - JWT ID token
 * @returns User information object with Cognito groups (not custom:role)
 */
export async function getUserFromIdToken(token: string) {
  const payload = await verifyIdToken(token);

  return {
    sub: payload.sub, // User's unique Cognito ID
    email: payload.email as string,
    emailVerified: payload.email_verified as boolean,
    name: payload.name as string | undefined,
    username: payload["cognito:username"] as string,
    groups: (payload["cognito:groups"] as string[]) || [],
  };
}

/**
 * Verify token from Authorization header
 *
 * Extracts Bearer token from header and verifies it
 *
 * @param authHeader - Full Authorization header (e.g., "Bearer eyJhbGc...")
 * @returns Verified token payload
 * @throws Error if header is malformed or token is invalid
 */
export async function verifyAuthorizationHeader(authHeader: string | null) {
  if (!authHeader) {
    throw new Error("No Authorization header provided");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error('Authorization header must be in format "Bearer <token>"');
  }

  const token = parts[1];
  return verifyAccessToken(token);
}

/**
 * Hydrate JWT verifiers (pre-download JWK keys)
 *
 * Call this during application startup to pre-cache the JWK keys
 * This prevents the first verification from being slow
 */
export async function hydrateJwtVerifiers() {
  try {
    await Promise.all([
      accessTokenVerifier.hydrate(),
      idTokenVerifier.hydrate(),
    ]);
  } catch (error) {
    console.error("Failed to hydrate JWT verifiers:", error);
  }
}
