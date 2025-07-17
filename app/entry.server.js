import { createApp } from "honox/server";
import { GodWearSession } from "./durable-objects/GodWearSession";

// Create app with proper Cloudflare bindings type
const app = createApp();
// Export Durable Object for Cloudflare Workers
export { GodWearSession };
export default app;
//# sourceMappingURL=entry.server.js.map