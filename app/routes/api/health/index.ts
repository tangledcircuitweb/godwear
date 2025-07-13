import { createRoute } from "honox/factory";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  createHealthResponse,
  createErrorResponse,
  ErrorCodes,
} from "../../../../types/api-responses";

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

  // Check basic service dependencies
  const dependencies = {
    kv: env.GODWEAR_KV ? 'healthy' as const : 'unhealthy' as const,
    database: env.DB ? 'healthy' as const : 'unhealthy' as const,
    mailersend: env.MAILERSEND_API_KEY ? 'healthy' as const : 'unhealthy' as const,
    google_oauth: (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) ? 'healthy' as const : 'unhealthy' as const,
  };

  // Determine overall status
  const unhealthyServices = Object.values(dependencies).filter(status => status === 'unhealthy');
  const status = unhealthyServices.length === 0 ? 'healthy' as const : 
                 unhealthyServices.length < Object.keys(dependencies).length ? 'degraded' as const : 
                 'unhealthy' as const;

  const healthResponse = createHealthResponse(
    "godwear-api",
    status,
    dependencies,
    "1.0.0"
  );

  // Return appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return c.json(healthResponse, httpStatus);
});
