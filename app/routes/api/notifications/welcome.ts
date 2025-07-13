import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import { WelcomeEmailRequestSchema, type WelcomeEmailRequest } from "../../../../types/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createHealthResponse,
  ErrorCodes,
  type ApiResponse,
  type EmailSuccessResponse,
  type HealthCheckResponse,
  type ErrorCode,
} from "../../../../types/api-responses";
import { MailerSendService } from "../../../lib/mailersend";

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Send welcome email notification
 * POST /api/notifications/welcome
 */
app.post("/", 
  zValidator("json", WelcomeEmailRequestSchema),
  async (c) => {
    try {
      // Check for required environment variables
      if (!c.env.MAILERSEND_API_KEY) {
        const errorResponse = createErrorResponse(
          ErrorCodes.SERVICE_CONFIGURATION_ERROR,
          "Email service not configured - MailerSend API key is missing",
          undefined,
          "notifications-welcome"
        );
        return c.json(errorResponse, 500);
      }

      // Get validated request body
      const body = c.req.valid("json");

      // Initialize MailerSend service
      const mailerSendService = new MailerSendService(c.env.MAILERSEND_API_KEY);

      // Send welcome email
      await mailerSendService.sendWelcomeEmail(body.email, body.name);

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
      // Handle specific MailerSend errors
      let errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
      let errorMessage = "Failed to send welcome email";
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorCode = ErrorCodes.SERVICE_CONFIGURATION_ERROR;
          errorMessage = "Invalid MailerSend API key";
          statusCode = 401;
        } else if (error.message.includes("rate limit")) {
          errorCode = ErrorCodes.SERVICE_RATE_LIMITED;
          errorMessage = "Rate limit exceeded";
          statusCode = 429;
        } else if (error.message.includes("quota")) {
          errorCode = ErrorCodes.SERVICE_QUOTA_EXCEEDED;
          errorMessage = "Email quota exceeded";
          statusCode = 429;
        }
      }

      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        {
          originalError: error instanceof Error ? error.message : "Unknown error",
        },
        "notifications-welcome"
      );

      return c.json(errorResponse, statusCode as 401 | 429 | 500);
    }
  }
);

/**
 * Health check for welcome email service
 * GET /api/notifications/welcome/health
 */
app.get("/health", (c) => {
  const dependencies = {
    mailersend: c.env.MAILERSEND_API_KEY ? 'healthy' as const : 'unhealthy' as const,
  };

  const status = dependencies.mailersend === 'healthy' ? 'healthy' as const : 'degraded' as const;

  const healthResponse = createHealthResponse(
    "notifications-welcome",
    status,
    dependencies,
    "1.0.0"
  );

  return c.json(healthResponse);
});

/**
 * Test endpoint for welcome email service
 * GET /api/notifications/welcome/test
 */
app.get("/test", (c) => {
  if (!c.env.MAILERSEND_API_KEY) {
    const errorResponse = createErrorResponse(
      ErrorCodes.SERVICE_CONFIGURATION_ERROR,
      "MailerSend API key not configured",
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
});

export default app;
