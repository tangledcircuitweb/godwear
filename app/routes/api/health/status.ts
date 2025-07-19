import { createRoute } from "honox/factory";
import { z } from "zod";
import { createDiscriminatedUnion, createHealthCheckResponseSchema } from "../../../lib/zod-compat";
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
 * Error codes enum
 */
const ErrorCodes = {
  SERVICE_CONFIGURATION_ERROR: "SERVICE_CONFIGURATION_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type ApiError = z.infer<typeof ApiErrorSchema>;
type ResponseMeta = z.infer<typeof ResponseMetaSchema>;
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
 * Detailed health status endpoint that checks connectivity to KV and D1 database
 * GET /api/health/status
 */
export default createRoute(async (c) => {
  const env = c.env as CloudflareBindings;

  if (!env) {
    const errorResponse = createErrorResponse(
      ErrorCodes.SERVICE_CONFIGURATION_ERROR,
      "Environment configuration not available",
      undefined,
      "health-api"
    );
    return c.json(errorResponse, 500);
  }

  try {
    // Initialize services
    const services = createServiceRegistry({
      env,
      request: c.req.raw,
    });

    // Get detailed health status using service layer
    const healthStatus = await services.health.getDetailedHealthStatus();

    // Check if there are any errors
    const hasErrors =
      healthStatus.kv.status === "error" || healthStatus.database.status === "error";

    if (hasErrors) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_UNAVAILABLE,
        "One or more services are unhealthy",
        healthStatus as Record<string, unknown>,
        "health-api"
      );

      return c.json(errorResponse, 503);
    }

    const successResponse = createSuccessResponse(healthStatus, {
      service: "health-api",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Health status check failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "health-api"
    );

    return c.json(errorResponse, 500);
  }
});
