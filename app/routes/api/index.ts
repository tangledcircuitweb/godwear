import { Hono } from "hono";
import createTrackingApi from "./tracking";
import createEmailAnalyticsApi from "./email-analytics";
import createEmailApi from "./emails";
import type { CloudflareBindings } from "../../lib/zod-utils";
import type { Services } from "../../services/registry";

/**
 * Create API routes
 */
export default function createApiRoutes(services: Services) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Create simple health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      service: "godwear-api",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Mount API routes
  app.route("/tracking", createTrackingApi(services));
  app.route("/email-analytics", createEmailAnalyticsApi(services));
  app.route("/emails", createEmailApi(services));

  return app;
}
