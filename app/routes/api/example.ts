import { createRoute } from "honox/factory";
import type { CloudflareBindings } from "../../../types/cloudflare";

// Example route demonstrating KV and D1 usage with proper types
export default createRoute(async (c) => {
  // Type assertion for environment bindings
  const env = c.env as CloudflareBindings;

  if (!env) {
    return c.json({ error: "Environment not available" }, 500);
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
    const result = await DB.prepare("SELECT 1 as test").first();

    return c.json({
      success: true,
      kv: kvValue,
      db: result,
      message: "Example API working with KV and D1",
    });
  } catch (error) {
    return c.json(
      {
        error: "Database operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});
