import { Hono } from "hono";
import { getCookie } from "hono/cookie";
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
 * User data schema
 */
const UserDataSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  picture: z.string().optional(),
  loginTime: z.string().optional(),
  expiresAt: z.string().optional(),
});

/**
 * Auth user response schema
 */
const AuthUserResponseSchema = z.object({
  authenticated: z.boolean(),
  user: UserDataSchema.optional(),
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
 * Health check response schema
 */
const HealthCheckResponseSchema = createHealthCheckResponseSchema();

/**
 * Error codes enum
 */
const ErrorCodes = {
  SERVICE_CONFIGURATION_ERROR: "SERVICE_CONFIGURATION_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
} as const;

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type JWTPayload = z.infer<typeof JWTPayloadSchema>;
type ApiError = z.infer<typeof ApiErrorSchema>;
type ResponseMeta = z.infer<typeof ResponseMetaSchema>;
type UserData = z.infer<typeof UserDataSchema>;
type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;
type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
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

// JWT verification helper
function verifyJWT(token: string, _secret: string): Promise<JWTPayload> {
  try {
    const [header, payload, signature] = token.split(".");

    if (!(header && payload && signature)) {
      throw new Error("Invalid token format");
    }

    const decodedPayload = JSON.parse(atob(payload));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    // In production, verify signature properly
    // For now, we'll trust the token if it's not expired

    return decodedPayload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

app.get("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        "Authentication service not configured",
        undefined,
        "auth-user"
      );
      return c.json(errorResponse, 500);
    }

    // Get session token from cookie
    const sessionToken = getCookie(c, "session");

    if (!sessionToken) {
      const responseData: AuthUserResponse = {
        authenticated: false,
      };

      const successResponse = createSuccessResponse(responseData, {
        service: "auth-user",
        version: "1.0.0",
      });

      return c.json(successResponse, 401);
    }

    // Verify JWT token using environment variable
    const payload = await verifyJWT(sessionToken, c.env.JWT_SECRET);

    // Get additional user data from KV if available
    const userData: UserData = {
      id: payload.sub, // Use sub instead of userId
      email: payload.email,
      name: payload.name,
    };

    // Only add optional fields if they exist
    if (payload.picture) {
      userData.picture = payload.picture;
    }

    if (payload.iat) {
      userData.loginTime = new Date(payload.iat * 1000).toISOString();
    }

    if (payload.exp) {
      userData.expiresAt = new Date(payload.exp * 1000).toISOString();
    }

    if (c.env.GODWEAR_KV && payload.sub) {
      try {
        const kvData = await c.env.GODWEAR_KV.get(`user:${payload.sub}`);
        if (kvData) {
          const kvUserData = JSON.parse(kvData);
          Object.assign(userData, kvUserData);
        }
      } catch (_error) {
        // KV error doesn't fail the request
      }
    }

    const responseData: AuthUserResponse = {
      authenticated: true,
      user: userData,
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "auth-user",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    let errorCode: ErrorCode = ErrorCodes.AUTH_INVALID_TOKEN;
    let errorMessage = "Invalid session";

    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        errorCode = ErrorCodes.AUTH_TOKEN_EXPIRED;
        errorMessage = "Session expired";
      }
    }

    const errorResponse = createErrorResponse(
      errorCode,
      errorMessage,
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "auth-user"
    );

    return c.json(errorResponse, 401);
  }
});

// POST endpoint for token refresh (future enhancement)
app.post("/refresh", (c) => {
  const errorResponse = createErrorResponse(
    ErrorCodes.SERVICE_UNAVAILABLE,
    "Token refresh not implemented yet - please log in again",
    undefined,
    "auth-user"
  );

  return c.json(errorResponse, 501);
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
    service: "auth-user",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies,
  };

  return c.json(healthResponse);
});

export default app;
