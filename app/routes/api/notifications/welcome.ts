import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDiscriminatedUnion, createHealthCheckResponseSchema } from "../../../lib/zod-compat";
import type { CloudflareBindings } from "../../../lib/zod-utils";
import { createServiceRegistry } from "../../../services";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Welcome email request schema
 */
const WelcomeEmailRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
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
 * Email success response schema
 */
const EmailSuccessResponseSchema = z.object({
  recipient: z.string(),
  service: z.string(),
  status: z.enum(["sent", "queued", "delivered"]),
  messageId: z.string().optional(),
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
  SERVICE_RATE_LIMITED: "SERVICE_RATE_LIMITED",
  SERVICE_QUOTA_EXCEEDED: "SERVICE_QUOTA_EXCEEDED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>;
type ApiError = z.infer<typeof ApiErrorSchema>;
type ResponseMeta = z.infer<typeof ResponseMetaSchema>;
type EmailSuccessResponse = z.infer<typeof EmailSuccessResponseSchema>;
type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
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

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Send welcome email notification
 * POST /api/notifications/welcome
 */
app.post("/", zValidator("json", WelcomeEmailRequestSchema), async (c) => {
  const env = c.env as CloudflareBindings;

  // Initialize services
  const services = createServiceRegistry({
    env,
    request: c.req.raw,
  });

  try {
    // Get validated request body
    const body = c.req.valid("json");

    // Send welcome email using service layer
    const result = await services.notifications.sendWelcomeEmail({
      email: body.email,
      name: body.name,
    });

    if (!result.success) {
      // Handle specific email service errors
      let errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
      let statusCode = 500;

      if (result.error?.includes("API key")) {
        errorCode = ErrorCodes.SERVICE_CONFIGURATION_ERROR;
        statusCode = 401;
      } else if (result.error?.includes("rate limit")) {
        errorCode = ErrorCodes.SERVICE_RATE_LIMITED;
        statusCode = 429;
      } else if (result.error?.includes("quota")) {
        errorCode = ErrorCodes.SERVICE_QUOTA_EXCEEDED;
        statusCode = 429;
      }

      const errorResponse = createErrorResponse(
        errorCode,
        result.error || "Failed to send welcome email",
        undefined,
        "notifications-welcome"
      );

      return c.json(errorResponse, statusCode as 401 | 429 | 500);
    }

    const responseData: EmailSuccessResponse = {
      recipient: body.email,
      service: "MailerSend",
      status: "sent",
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "notifications-welcome",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Failed to send welcome email",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "notifications-welcome"
    );

    return c.json(errorResponse, 500);
  }
});

/**
 * Health check for welcome email service
 * GET /api/notifications/welcome/health
 */
app.get("/health", async (c) => {
  const env = c.env as CloudflareBindings;

  try {
    // Initialize services
    const services = createServiceRegistry({
      env,
      request: c.req.raw,
    });

    // Get notification service health status
    const healthStatus = await services.notifications.healthCheck();

    const healthResponse = createHealthResponse(
      "notifications-welcome",
      healthStatus.status,
      (healthStatus.details as Record<string, "healthy" | "degraded" | "unhealthy">) || {},
      "1.0.0"
    );

    const httpStatus =
      healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;

    return c.json(healthResponse, httpStatus);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Health check failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "notifications-welcome"
    );

    return c.json(errorResponse, 500);
  }
});

/**
 * Test endpoint for welcome email service
 * GET /api/notifications/welcome/test
 */
app.get("/test", async (c) => {
  const env = c.env as CloudflareBindings;

  try {
    // Initialize services
    const services = createServiceRegistry({
      env,
      request: c.req.raw,
    });

    // Test email configuration
    const testResult = await services.notifications.testEmailConfiguration();

    if (!testResult.success) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        testResult.error || "Email service test failed",
        { configured: false },
        "notifications-welcome"
      );
      return c.json(errorResponse, 500);
    }

    const successResponse = createSuccessResponse(
      {
        message: "Welcome email notification service is ready",
        configured: true,
      },
      {
        service: "notifications-welcome",
        version: "1.0.0",
      }
    );

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Service test failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "notifications-welcome"
    );

    return c.json(errorResponse, 500);
  }
});

export default app;
