import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { createErrorResponse, createSuccessResponse, ErrorCodes, } from "../../../../types/api-responses";

const app = new Hono();
// JWT verification helper (simplified for logout)
function verifyJWT(token, _secret) {
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
    }
    catch (_error) {
        throw new Error("Invalid token");
    }
}
app.post("/", async (c) => {
    try {
        // Check for JWT secret
        if (!c.env.JWT_SECRET) {
            const errorResponse = createErrorResponse(ErrorCodes.SERVICE_CONFIGURATION_ERROR, "Authentication service not configured", undefined, "auth-logout");
            return c.json(errorResponse, 500);
        }
        // Get session token
        const sessionToken = getCookie(c, "session");
        if (sessionToken && typeof sessionToken === "string") {
            try {
                // Verify and decode token to get user info
                const payload = verifyJWT(sessionToken, c.env.JWT_SECRET);
                // Remove user from KV store
                if (c.env.GODWEAR_KV && payload.sub) {
                    await c.env.GODWEAR_KV.delete(`user:${payload.sub}`);
                }
            }
            catch (_error) {
                // Ignore verification errors during logout
            }
        }
        // Clear session cookie
        deleteCookie(c, "session", { path: "/" });
        // Clear any other auth-related cookies
        deleteCookie(c, "oauth_state", { path: "/api/auth" });
        deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });
        const successResponse = createSuccessResponse({
            message: "Logged out successfully",
            cleared: ["session", "oauth_state", "oauth_code_verifier"],
        }, {
            service: "auth-logout",
            version: "1.0.0",
        });
        return c.json(successResponse);
    }
    catch (error) {
        const errorResponse = createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, "Logout failed", {
            originalError: error instanceof Error ? error.message : "Unknown error",
        }, "auth-logout");
        return c.json(errorResponse, 500);
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
                if (c.env.GODWEAR_KV && payload.sub) {
                    await c.env.GODWEAR_KV.delete(`user:${payload.sub}`);
                }
            }
            catch (_error) {
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
    }
    catch (_error) {
        return c.redirect("/?error=logout_failed");
    }
});
// Health check endpoint
app.get("/health", (c) => {
    const dependencies = {
        jwt: c.env.JWT_SECRET ? "healthy" : "unhealthy",
        kv: c.env.GODWEAR_KV ? "healthy" : "degraded",
    };
    const status = dependencies.jwt === "healthy" ? "healthy" : "degraded";
    const healthResponse = {
        status,
        service: "auth-logout",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        dependencies,
    };
    return c.json(healthResponse);
});
export default app;
//# sourceMappingURL=logout.js.map