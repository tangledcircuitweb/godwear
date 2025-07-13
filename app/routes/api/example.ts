import { createRoute } from "honox/factory";
import type { CloudflareBindings } from "../../../types/cloudflare";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type ApiResponse,
  type DatabaseResponse,
} from "../../../types/api-responses";

interface ExampleData {
  kv: unknown;
  db: unknown;
  message: string;
}

// Example route demonstrating KV and D1 usage with standardized responses
export default createRoute(async (c) => {
  // Type assertion for environment bindings
  const env = c.env as CloudflareBindings;

  if (!env) {
    const errorResponse = createErrorResponse(
      ErrorCodes.SERVICE_CONFIGURATION_ERROR,
      "Environment configuration not available",
      undefined,
      "example-api"
    );
    return c.json(errorResponse, 500);
  }

  const { GODWEAR_KV, DB } = env;

  try {
    // Example KV operations
    await GODWEAR_KV.put(
      "example-key",
      JSON.stringify({
        message: "Hello from KV!",
        timestamp: new Date().toISOString(),
      })
    );

    const kvValue = await GODWEAR_KV.get("example-key", "json");

    // Example D1 operations
    const dbResult = await DB.prepare("SELECT 1 as test").first();

    const responseData: ExampleData = {
      kv: kvValue,
      db: dbResult,
      message: "Example API working with KV and D1",
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "example-api",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.DATABASE_QUERY_ERROR,
      "Database operation failed",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "example-api"
    );

    return c.json(errorResponse, 500);
  }
});
