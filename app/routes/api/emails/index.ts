import { Hono } from "hono";
import { createEmailHandlers } from "./handlers";
import type { CloudflareBindings } from "../../../lib/zod-utils";
import type { Services } from "../../../services/registry";

/**
 * Create email management API
 */
export default function createEmailApi(services: Services) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Mount email handlers
  app.route("/", createEmailHandlers(services));
  
  return app;
}
