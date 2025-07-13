import { createRoute } from "honox/factory";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type ApiResponse,
} from "../../../../types/api-responses";

interface HealthStatusData extends Record<string, unknown> {
  kv: {
    status: "healthy" | "error";
    data?: unknown;
    error?: string;
  };
  database: {
    status: "healthy" | "error";
    data?: unknown;
    error?: string;
  };
  message: string;
  timestamp: string;
}

/**
 * Health status endpoint that checks connectivity to KV and D1 database
 * GET /api/health/status
 */
export default createRoute(async (c) => {
  // Type assertion for environment bindings
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

  const { GODWEAR_KV, DB } = env;
  const timestamp = new Date().toISOString();

  // Initialize health status
  const healthStatus: HealthStatusData = {
    kv: { status: "healthy" },
    database: { status: "healthy" },
    message: "System health check completed",
    timestamp,
  };

  let hasErrors = false;

  // Test KV connectivity
  try {
    const testKey = `health-check-${Date.now()}`;
    const testData = {
      message: "Health check test",
      timestamp,
    };

    await GODWEAR_KV.put(testKey, JSON.stringify(testData));
    const kvValue = await GODWEAR_KV.get(testKey, "json");
    
    // Clean up test data
    await GODWEAR_KV.delete(testKey);

    healthStatus.kv = {
      status: "healthy",
      data: kvValue,
    };
  } catch (error) {
    hasErrors = true;
    healthStatus.kv = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown KV error",
    };
  }

  // Test D1 database connectivity
  try {
    const dbResult = await DB.prepare("SELECT 1 as health_check, datetime('now') as timestamp").first();
    
    healthStatus.database = {
      status: "healthy",
      data: dbResult,
    };
  } catch (error) {
    hasErrors = true;
    healthStatus.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  // Return appropriate response based on health status
  if (hasErrors) {
    healthStatus.message = "System health check completed with errors";
    
    const errorResponse = createErrorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      "One or more services are unhealthy",
      healthStatus,
      "health-api"
    );

    return c.json(errorResponse, 503);
  }

  const successResponse = createSuccessResponse(healthStatus, {
    service: "health-api",
    version: "1.0.0",
  });

  return c.json(successResponse);
});
