import { z } from "zod";
import { getCookie } from "hono/cookie";
import type { Context, Next } from "hono";

// ============================================================================
// LOCAL SCHEMAS - Everything this middleware needs defined locally
// ============================================================================

/**
 * Local Environment Schema - Only what this middleware needs
 */
const LocalEnvironmentSchema = z.object({
  JWT_SECRET: z.string(),
  NODE_ENV: z.string().optional(),
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

/**
 * JWT Header Schema - Local definition
 */
const JWTHeaderSchema = z.object({
  alg: z.string(),
  typ: z.string(),
});

type JWTHeader = z.infer<typeof JWTHeaderSchema>;

/**
 * JWT Payload Schema - Local definition with all required claims
 */
const JWTPayloadSchema = z.object({
  sub: z.string(), // User ID (standard JWT claim)
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
  email_verified: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(), // Issuer
  aud: z.string(), // Audience
  jti: z.string().optional(), // JWT ID for uniqueness
});

type JWTPayload = z.infer<typeof JWTPayloadSchema>;

/**
 * Authenticated User Schema - What we expose to routes
 */
const AuthenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
  verifiedEmail: z.boolean().optional(),
  loginTime: z.string().optional(),
  expiresAt: z.string().optional(),
});

type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

/**
 * Auth Context Schema - What gets added to Hono context
 */
const AuthContextSchema = z.object({
  user: AuthenticatedUserSchema,
  isAuthenticated: z.literal(true),
});

type AuthContext = z.infer<typeof AuthContextSchema>;

/**
 * Middleware Options Schema
 */
const MiddlewareOptionsSchema = z.object({
  redirectTo: z.string().optional().default("/admin/login"),
  requireAdmin: z.boolean().optional().default(false),
  allowedRoles: z.array(z.string()).optional(),
});

type MiddlewareOptions = z.infer<typeof MiddlewareOptionsSchema>;

// ============================================================================
// JWT VERIFICATION UTILITIES - Self-contained
// ============================================================================

/**
 * Verify JWT token using Web Crypto API
 * Completely self-contained with local error handling
 */
async function verifyJWTToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid JWT format" };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature using Web Crypto API
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    if (!encodedSignature) {
      return { valid: false, error: "Invalid JWT signature format" };
    }

    const signature = new Uint8Array(
      atob(encodedSignature)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));

    if (!isValid) {
      return { valid: false, error: "Invalid JWT signature" };
    }

    // Parse and validate payload
    if (!encodedPayload) {
      return { valid: false, error: "Invalid JWT payload format" };
    }

    const rawPayload = JSON.parse(atob(encodedPayload));
    const payload = JWTPayloadSchema.parse(rawPayload);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { valid: false, error: "JWT token expired" };
    }

    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "JWT verification failed" 
    };
  }
}

/**
 * Extract user information from JWT payload
 */
function extractUserFromPayload(payload: JWTPayload): AuthenticatedUser {
  return AuthenticatedUserSchema.parse({
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    verifiedEmail: payload.email_verified,
    loginTime: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
  });
}

// ============================================================================
// MIDDLEWARE IMPLEMENTATIONS - AI-First Self-Contained
// ============================================================================

/**
 * Core authentication middleware
 * Validates JWT and adds user to context
 */
export function requireAuth(options: MiddlewareOptions = {}) {
  const config = MiddlewareOptionsSchema.parse(options);

  return async (c: Context, next: Next) => {
    try {
      // Validate environment variables this middleware needs
      const env = LocalEnvironmentSchema.parse({
        JWT_SECRET: c.env.JWT_SECRET,
        NODE_ENV: c.env.NODE_ENV,
      });

      // Get session token from cookie
      const sessionToken = getCookie(c, "session");

      if (!sessionToken) {
        // Redirect to login if no token
        return c.redirect(config.redirectTo);
      }

      // Verify JWT token
      const verification = await verifyJWTToken(sessionToken, env.JWT_SECRET);

      if (!verification.valid || !verification.payload) {
        // Clear invalid session cookie
        c.header("Set-Cookie", "session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
        return c.redirect(config.redirectTo);
      }

      // Extract user information
      const user = extractUserFromPayload(verification.payload);

      // Add authentication context to Hono context
      c.set("user", user);
      c.set("isAuthenticated", true);

      // Continue to next middleware/handler
      await next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      
      // Clear potentially corrupted session
      c.header("Set-Cookie", "session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
      
      return c.redirect(config.redirectTo);
    }
  };
}

/**
 * Admin-specific authentication middleware
 * Requires authentication + admin role check
 */
export function requireAdmin(options: MiddlewareOptions = {}) {
  const config = MiddlewareOptionsSchema.parse({
    ...options,
    requireAdmin: true,
  });

  return async (c: Context, next: Next) => {
    try {
      // First run standard auth check
      await requireAuth(config)(c, async () => {
        // Get authenticated user from context
        const user = c.get("user") as AuthenticatedUser;
        
        // TODO: Implement admin role checking
        // For now, we'll check if email is in admin list
        const adminEmails = [
          "admin@godwear.ca",
          "njordrenterprises@gmail.com", // Your email
        ];

        if (!adminEmails.includes(user.email)) {
          // User is authenticated but not admin
          return c.json(
            {
              success: false,
              error: "Admin access required",
              code: "INSUFFICIENT_PERMISSIONS",
            },
            403
          );
        }

        // User is admin, continue
        await next();
      });
    } catch (error) {
      console.error("Admin authentication middleware error:", error);
      return c.redirect(config.redirectTo);
    }
  };
}

/**
 * Optional authentication middleware
 * Adds user to context if authenticated, but doesn't require it
 */
export function optionalAuth() {
  return async (c: Context, next: Next) => {
    try {
      // Validate environment variables
      const env = LocalEnvironmentSchema.parse({
        JWT_SECRET: c.env.JWT_SECRET,
        NODE_ENV: c.env.NODE_ENV,
      });

      // Get session token from cookie
      const sessionToken = getCookie(c, "session");

      if (sessionToken) {
        // Verify JWT token
        const verification = await verifyJWTToken(sessionToken, env.JWT_SECRET);

        if (verification.valid && verification.payload) {
          // Extract user information
          const user = extractUserFromPayload(verification.payload);

          // Add authentication context
          c.set("user", user);
          c.set("isAuthenticated", true);
        } else {
          // Invalid token, clear it
          c.header("Set-Cookie", "session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
          c.set("isAuthenticated", false);
        }
      } else {
        c.set("isAuthenticated", false);
      }

      await next();
    } catch (error) {
      console.error("Optional authentication middleware error:", error);
      c.set("isAuthenticated", false);
      await next();
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS - Self-contained helpers
// ============================================================================

/**
 * Get authenticated user from context
 * Type-safe helper for route handlers
 */
export function getAuthenticatedUser(c: Context): AuthenticatedUser | null {
  try {
    const user = c.get("user");
    const isAuthenticated = c.get("isAuthenticated");

    if (isAuthenticated && user) {
      return AuthenticatedUserSchema.parse(user);
    }

    return null;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Check if current user is admin
 * Self-contained admin check logic
 */
export function isCurrentUserAdmin(c: Context): boolean {
  const user = getAuthenticatedUser(c);
  
  if (!user) {
    return false;
  }

  // Admin email list (in production, this would come from database)
  const adminEmails = [
    "admin@godwear.ca",
    "njordrenterprises@gmail.com",
  ];

  return adminEmails.includes(user.email);
}

// ============================================================================
// TYPE EXPORTS FOR ROUTE HANDLERS - Local types only
// ============================================================================

export type { AuthenticatedUser, AuthContext, MiddlewareOptions };
