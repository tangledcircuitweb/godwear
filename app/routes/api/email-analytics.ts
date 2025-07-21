import { Hono } from "hono";
import { createAnalyticsRoutes } from "../../emails/analytics/analytics-api";
import type { CloudflareBindings } from "../../lib/zod-utils";
import type { Services } from "../../services/registry";

/**
 * Create email analytics API routes
 */
export default function createEmailAnalyticsApi(services: Services) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Mount analytics routes
  app.route("/", createAnalyticsRoutes(services.emailAnalytics));
  
  return app;
}
