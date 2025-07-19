import { setCookie } from "hono/cookie";
import { createRoute } from "honox/factory";
import { z } from "zod";
import type { CloudflareBindings } from "../../../lib/zod-utils";
import { createServiceRegistry } from "../../../services";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Standard API Error schema
 */
const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
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
 * Login response schema
 */
const LoginResponseSchema = z.object({
  redirectUrl: z.string(),
  provider: z.string(),
});

/**
 * API Response schema - discriminated union for type safety
 */
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      data: dataSchema,
      meta: ResponseMetaSchema.optional(),
    }),
    z.object({
      success: z.literal(false),
      error: ApiErrorSchema,
    }),
  ]);

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

type ApiError = z.infer<typeof ApiErrorSchema>;
type ResponseMeta = z.infer<typeof ResponseMetaSchema>;
type LoginResponse = z.infer<typeof LoginResponseSchema>;
type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
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

/**
 * Initiate OAuth login
 * GET /api/auth/login
 */
export default createRoute(async (c) => {
  const env = c.env as CloudflareBindings;

  // Initialize services
  const services = createServiceRegistry({
    env,
    request: c.req.raw,
  });

  try {
    // Check if required OAuth configuration is available
    if (!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        "OAuth configuration not available",
        undefined,
        "auth-login"
      );
      return c.json(errorResponse, 500);
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();

    // Set state cookie
    setCookie(c, "oauth_state", state, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    // Generate OAuth URL using service layer
    const oauthUrl = services.auth.generateGoogleOAuthUrl(c.req.raw, state);

    const responseData: LoginResponse = {
      redirectUrl: oauthUrl,
      provider: "google",
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "auth-login",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Failed to initiate login",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "auth-login"
    );

    return c.json(errorResponse, 500);
  }
});
