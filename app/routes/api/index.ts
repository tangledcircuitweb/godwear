import { Hono } from "hono";
import createHealthApi from "./health";
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

  // Mount API routes
  app.route("/health", createHealthApi(services));
  app.route("/tracking", createTrackingApi(services));
  app.route("/email-analytics", createEmailAnalyticsApi(services));
  app.route("/emails", createEmailApi(services));

  return app;
}
