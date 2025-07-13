import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import type { JWTPayload } from "../../../../types/auth";
import type { CloudflareBindings } from "../../../../types/cloudflare";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// JWT verification helper (simplified for logout)
function verifyJWT(token: string, _secret: string): JWTPayload {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [_header, payload, _signature] = parts;
    if (!payload) {
      throw new Error("Missing payload");
    }

    const decodedPayload = JSON.parse(atob(payload));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return decodedPayload;
  } catch (_error) {
    throw new Error("Invalid token");
  }
}

app.post("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      return c.json({ error: "Configuration error" }, 500);
    }

    // Get session token
    const sessionToken = getCookie(c, "session");

    if (sessionToken && typeof sessionToken === "string") {
      try {
        // Verify and decode token to get user info
        const payload = verifyJWT(sessionToken, c.env.JWT_SECRET);

        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.userId) {
          await c.env.GODWEAR_KV.delete(`user:${payload.userId}`);
        }
      } catch (_error) {
        // Ignore verification errors during logout
      }
    }

    // Clear session cookie
    deleteCookie(c, "session", { path: "/" });

    // Clear any other auth-related cookies
    deleteCookie(c, "oauth_state", { path: "/api/auth" });
    deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return c.json(
      {
        error: "Logout failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// GET endpoint for logout (for simple links)
app.get("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      return c.redirect("/?error=configuration_error");
    }

    // Get session token
    const sessionToken = getCookie(c, "session");

    if (sessionToken && typeof sessionToken === "string") {
      try {
        // Verify and decode token to get user info
        const payload = verifyJWT(sessionToken, c.env.JWT_SECRET);

        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.userId) {
          await c.env.GODWEAR_KV.delete(`user:${payload.userId}`);
        }
      } catch (_error) {
        // Ignore verification errors during logout
      }
    }

    // Clear session cookie
    deleteCookie(c, "session", { path: "/" });

    // Clear any other auth-related cookies
    deleteCookie(c, "oauth_state", { path: "/api/auth" });
    deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });

    // Redirect to home page with logout confirmation
    return c.redirect("/?logout=success");
  } catch (_error) {
    return c.redirect("/?error=logout_failed");
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "oauth-logout",
    timestamp: new Date().toISOString(),
    hasJwtSecret: !!c.env.JWT_SECRET,
  });
});

export default app;
