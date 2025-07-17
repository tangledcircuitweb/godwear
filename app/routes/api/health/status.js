import { createRoute } from "honox/factory";
import { createErrorResponse, createSuccessResponse, ErrorCodes, } from "../../../../types/api-responses";
import { createServiceRegistry } from "../../../services";
/**
 * Detailed health status endpoint that checks connectivity to KV and D1 database
 * GET /api/health/status
 */
export default createRoute(async (c) => {
    const env = c.env;
    if (!env) {
        const errorResponse = createErrorResponse(ErrorCodes.SERVICE_CONFIGURATION_ERROR, "Environment configuration not available", undefined, "health-api");
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
        const hasErrors = healthStatus.kv.status === "error" || healthStatus.database.status === "error";
        if (hasErrors) {
            const errorResponse = createErrorResponse(ErrorCodes.SERVICE_UNAVAILABLE, "One or more services are unhealthy", healthStatus, "health-api");
            return c.json(errorResponse, 503);
        }
        const successResponse = createSuccessResponse(healthStatus, {
            service: "health-api",
            version: "1.0.0",
        });
        return c.json(successResponse);
    }
    catch (error) {
        const errorResponse = createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, "Health status check failed", {
            originalError: error instanceof Error ? error.message : "Unknown error",
        }, "health-api");
        return c.json(errorResponse, 500);
    }
});
//# sourceMappingURL=status.js.map