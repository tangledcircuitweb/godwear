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
 * Health check response schema
 */
const HealthCheckResponseSchema = createHealthCheckResponseSchema();

/**
 * API Response schema - discriminated union for type safety
 */
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  const successSchema = z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime().optional(),
      requestId: z.string().optional(),
      version: z.string().optional(),
      service: z.string().optional(),
    }).optional(),
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
type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
 * Create a health check response
 */
function createHealthResponse(
  service: string,
  status: HealthCheckResponse["status"] = "healthy",
  dependencies?: Record<string, "healthy" | "degraded" | "unhealthy">,
  version?: string
): HealthCheckResponse {
  const response: HealthCheckResponse = {
    status,
    service,
    timestamp: new Date().toISOString(),
  };

  if (version) {
    response.version = version;
  }

  if (dependencies) {
    response.dependencies = dependencies;
  }

  const uptime = process.uptime?.();
  if (uptime !== undefined) {
    response.uptime = uptime;
  }

  return response;
}

/**
 * Main health check endpoint
 * GET /api/health
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

    // Get system health using service layer
    const systemHealth = await services.health.getSystemHealth();

    // Get all services health status
    const _servicesHealth = await services.getHealthStatus();

    // Create health response
    const healthResponse = createHealthResponse(
      "godwear-api",
      systemHealth.overall,
      systemHealth.dependencies,
      "1.0.0"
    );

    // Return appropriate HTTP status code
    const httpStatus =
      systemHealth.overall === "healthy" ? 200 : systemHealth.overall === "degraded" ? 200 : 503;

    return c.json(healthResponse, httpStatus);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Health check failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "health-api"
    );

    return c.json(errorResponse, 500);
  }
});
