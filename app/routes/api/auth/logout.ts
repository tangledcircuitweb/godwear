import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { z } from "zod";
import { createDiscriminatedUnion, createHealthCheckResponseSchema } from "../../../lib/zod-compat";
import type { CloudflareBindings } from "../../../lib/zod-utils";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * JWT Payload schema
 */
const JWTPayloadSchema = z.object({
  sub: z.string(), // User ID (standard JWT claim)
  email: z.string(),
  name: z.string(),
  picture: z.string().optional(),
  email_verified: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(), // Issuer
  aud: z.string(), // Audience
});

/**
 * Standard API Error schema
 */
const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
  service: z.string().optional(),
});

/**
 * Response metadata schema
 */
const ResponseMetaSchema = z.object({
  timestamp: z.string().datetime().optional(),
  requestId: z.string().optional(),
  version: z.string().optional(),
  service: z.string().optional(),
});

/**
 * API Response schema - discriminated union for type safety
 */
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  const successSchema = z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: ResponseMetaSchema.optional(),
  });
  
  const errorSchema = z.object({
    success: z.literal(false),
    error: ApiErrorSchema,
  });
  
  return createDiscriminatedUnion("success", [successSchema, errorSchema]);
};

/**
 * Logout response schema
 */
const LogoutResponseSchema = z.object({
  message: z.string(),
  cleared: z.array(z.string()),
});

/**
 * Health check response schema
 */
const HealthCheckResponseSchema = createHealthCheckResponseSchema();

/**
 * Error codes enum
 */
const ErrorCodes = {
  SERVICE_CONFIGURATION_ERROR: "SERVICE_CONFIGURATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type JWTPayload = z.infer<typeof JWTPayloadSchema>;
type ApiError = z.infer<typeof ApiErrorSchema>;
type ResponseMeta = z.infer<typeof ResponseMetaSchema>;
type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a successful API response
 */
function createSuccessResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Create an error API response
 */
function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  service?: string
): ApiResponse<never> {
  const error: ApiError = {
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    error.details = details;
  }

  if (service) {
    error.service = service;
  }

  return {
    success: false,
    error,
  };
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

// JWT verification helper (simplified for logout)
function verifyJWT(token: string, _secret: string): JWTPayload {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [_header, payload, _signature] = parts;
    if (!payload) {
      throw new Error("Missing payload");
    }

    const decodedPayload = JSON.parse(atob(payload));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return decodedPayload;
  } catch (_error) {
    throw new Error("Invalid token");
  }
}

app.post("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        "Authentication service not configured",
        undefined,
        "auth-logout"
      );
      return c.json(errorResponse, 500);
    }

    // Get session token
    const sessionToken = getCookie(c, "session");

    if (sessionToken && typeof sessionToken === "string") {
      try {
        // Verify and decode token to get user info
        const payload = verifyJWT(sessionToken, c.env.JWT_SECRET);

        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.sub) {
          await c.env.GODWEAR_KV.delete(`user:${payload.sub}`);
        }
      } catch (_error) {
        // Ignore verification errors during logout
      }
    }

    // Clear session cookie
    deleteCookie(c, "session", { path: "/" });

    // Clear any other auth-related cookies
    deleteCookie(c, "oauth_state", { path: "/api/auth" });
    deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });

    const successResponse = createSuccessResponse(
      {
        message: "Logged out successfully",
        cleared: ["session", "oauth_state", "oauth_code_verifier"],
      },
      {
        service: "auth-logout",
        version: "1.0.0",
      }
    );

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Logout failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "auth-logout"
    );

    return c.json(errorResponse, 500);
  }
});

// GET endpoint for logout (for simple links)
app.get("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      return c.redirect("/?error=configuration_error");
    }

    // Get session token
    const sessionToken = getCookie(c, "session");

    if (sessionToken && typeof sessionToken === "string") {
      try {
        // Verify and decode token to get user info
        const payload = verifyJWT(sessionToken, c.env.JWT_SECRET);

        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.sub) {
          await c.env.GODWEAR_KV.delete(`user:${payload.sub}`);
        }
      } catch (_error) {
        // Ignore verification errors during logout
      }
    }

    // Clear session cookie
    deleteCookie(c, "session", { path: "/" });

    // Clear any other auth-related cookies
    deleteCookie(c, "oauth_state", { path: "/api/auth" });
    deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });

    // Redirect to home page with logout confirmation
    return c.redirect("/?logout=success");
  } catch (_error) {
    return c.redirect("/?error=logout_failed");
  }
});

// Health check endpoint
app.get("/health", (c) => {
  const dependencies = {
    jwt: c.env.JWT_SECRET ? ("healthy" as const) : ("unhealthy" as const),
    kv: c.env.GODWEAR_KV ? ("healthy" as const) : ("degraded" as const),
  };

  const status = dependencies.jwt === "healthy" ? ("healthy" as const) : ("degraded" as const);

  const healthResponse: HealthCheckResponse = {
    status,
    service: "auth-logout",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies,
  };

  return c.json(healthResponse);
});

export default app;
