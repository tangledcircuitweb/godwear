import { createRoute } from "honox/factory";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  createHealthResponse,
  createErrorResponse,
  ErrorCodes,
} from "../../../../types/api-responses";
import { createServiceRegistry } from "../../../services";

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
    const servicesHealth = await services.getHealthStatus();

    // Create health response
    const healthResponse = createHealthResponse(
      "godwear-api",
      systemHealth.overall,
      systemHealth.dependencies,
      "1.0.0"
    );

    // Return appropriate HTTP status code
    const httpStatus = systemHealth.overall === 'healthy' ? 200 : 
                      systemHealth.overall === 'degraded' ? 200 : 503;

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
