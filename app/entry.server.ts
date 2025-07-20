import { createApp } from "honox/server";
import { GodWearSession } from "./durable-objects/GodWearSession";
import type { CloudflareBindings } from "./lib/zod-utils";

// Create app with proper Cloudflare bindings type
const app = createApp<{ Bindings: CloudflareBindings }>();

// Export Durable Object for Cloudflare Workers
export { GodWearSession };

export default app;
