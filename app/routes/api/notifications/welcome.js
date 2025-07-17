import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createErrorResponse, createHealthResponse, createSuccessResponse, ErrorCodes, } from "../../../../types/api-responses";
import { WelcomeEmailRequestSchema } from "../../../../types/validation";
import { createServiceRegistry } from "../../../services";

const app = new Hono();
/**
 * Send welcome email notification
 * POST /api/notifications/welcome
 */
app.post("/", zValidator("json", WelcomeEmailRequestSchema), async (c) => {
    const env = c.env;
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
            let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
            let statusCode = 500;
            if (result.error?.includes("API key")) {
                errorCode = ErrorCodes.SERVICE_CONFIGURATION_ERROR;
                statusCode = 401;
            }
            else if (result.error?.includes("rate limit")) {
                errorCode = ErrorCodes.SERVICE_RATE_LIMITED;
                statusCode = 429;
            }
            else if (result.error?.includes("quota")) {
                errorCode = ErrorCodes.SERVICE_QUOTA_EXCEEDED;
                statusCode = 429;
            }
            const errorResponse = createErrorResponse(errorCode, result.error || "Failed to send welcome email", undefined, "notifications-welcome");
            return c.json(errorResponse, statusCode);
        }
        const responseData = {
            recipient: body.email,
            service: "MailerSend",
            status: "sent",
        };
        const successResponse = createSuccessResponse(responseData, {
            service: "notifications-welcome",
            version: "1.0.0",
        });
        return c.json(successResponse);
    }
    catch (error) {
        const errorResponse = createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, "Failed to send welcome email", {
            originalError: error instanceof Error ? error.message : "Unknown error",
        }, "notifications-welcome");
        return c.json(errorResponse, 500);
    }
});
/**
 * Health check for welcome email service
 * GET /api/notifications/welcome/health
 */
app.get("/health", async (c) => {
    const env = c.env;
    try {
        // Initialize services
        const services = createServiceRegistry({
            env,
            request: c.req.raw,
        });
        // Get notification service health status
        const healthStatus = await services.notifications.healthCheck();
        const healthResponse = createHealthResponse("notifications-welcome", healthStatus.status, healthStatus.details || {}, "1.0.0");
        const httpStatus = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;
        return c.json(healthResponse, httpStatus);
    }
    catch (error) {
        const errorResponse = createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, "Health check failed", {
            originalError: error instanceof Error ? error.message : "Unknown error",
        }, "notifications-welcome");
        return c.json(errorResponse, 500);
    }
});
/**
 * Test endpoint for welcome email service
 * GET /api/notifications/welcome/test
 */
app.get("/test", async (c) => {
    const env = c.env;
    try {
        // Initialize services
        const services = createServiceRegistry({
            env,
            request: c.req.raw,
        });
        // Test email configuration
        const testResult = await services.notifications.testEmailConfiguration();
        if (!testResult.success) {
            const errorResponse = createErrorResponse(ErrorCodes.SERVICE_CONFIGURATION_ERROR, testResult.error || "Email service test failed", { configured: false }, "notifications-welcome");
            return c.json(errorResponse, 500);
        }
        const successResponse = createSuccessResponse({
            message: "Welcome email notification service is ready",
            configured: true,
        }, {
            service: "notifications-welcome",
            version: "1.0.0",
        });
        return c.json(successResponse);
    }
    catch (error) {
        const errorResponse = createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, "Service test failed", {
            originalError: error instanceof Error ? error.message : "Unknown error",
        }, "notifications-welcome");
        return c.json(errorResponse, 500);
    }
});
export default app;
//# sourceMappingURL=welcome.js.map