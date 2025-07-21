import { Hono } from "hono";
import { createTrackingRoutes } from "../../emails/analytics/tracking-handlers";
import type { CloudflareBindings } from "../../lib/zod-utils";
import type { Services } from "../../services/registry";

/**
 * Create email tracking API routes
 */
export default function createTrackingApi(services: Services) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Mount tracking routes
  app.route("/", createTrackingRoutes(services.emailAnalytics));
  
  return app;
}
