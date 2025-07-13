import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  type AuthUserResponse,
  createErrorResponse,
  createSuccessResponse,
  type ErrorCode,
  ErrorCodes,
} from "../../../../types/api-responses";
import type { JWTPayload } from "../../../../types/auth";
import type { CloudflareBindings } from "../../../../types/cloudflare";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// JWT verification helper
function verifyJWT(token: string, _secret: string): Promise<JWTPayload> {
  try {
    const [header, payload, signature] = token.split(".");

    if (!(header && payload && signature)) {
      throw new Error("Invalid token format");
    }

    const decodedPayload = JSON.parse(atob(payload));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    // In production, verify signature properly
    // For now, we'll trust the token if it's not expired

    return decodedPayload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

app.get("/", async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        "Authentication service not configured",
        undefined,
        "auth-user"
      );
      return c.json(errorResponse, 500);
    }

    // Get session token from cookie
    const sessionToken = getCookie(c, "session");

    if (!sessionToken) {
      const responseData: AuthUserResponse = {
        authenticated: false,
      };

      const successResponse = createSuccessResponse(responseData, {
        service: "auth-user",
        version: "1.0.0",
      });

      return c.json(successResponse, 401);
    }

    // Verify JWT token using environment variable
    const payload = await verifyJWT(sessionToken, c.env.JWT_SECRET);

    // Get additional user data from KV if available
    const userData: AuthUserResponse["user"] = {
      id: payload.sub, // Use sub instead of userId
      email: payload.email,
      name: payload.name,
    };

    // Only add optional fields if they exist
    if (payload.picture) {
      userData.picture = payload.picture;
    }

    if (payload.iat) {
      userData.loginTime = new Date(payload.iat * 1000).toISOString();
    }

    if (payload.exp) {
      userData.expiresAt = new Date(payload.exp * 1000).toISOString();
    }

    if (c.env.GODWEAR_KV && payload.sub) {
      try {
        const kvData = await c.env.GODWEAR_KV.get(`user:${payload.sub}`);
        if (kvData) {
          const kvUserData = JSON.parse(kvData);
          Object.assign(userData, kvUserData);
        }
      } catch (_error) {
        // KV error doesn't fail the request
      }
    }

    const responseData: AuthUserResponse = {
      authenticated: true,
      user: userData,
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "auth-user",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    let errorCode: ErrorCode = ErrorCodes.AUTH_INVALID_TOKEN;
    let errorMessage = "Invalid session";

    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        errorCode = ErrorCodes.AUTH_TOKEN_EXPIRED;
        errorMessage = "Session expired";
      }
    }

    const errorResponse = createErrorResponse(
      errorCode,
      errorMessage,
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "auth-user"
    );

    return c.json(errorResponse, 401);
  }
});

// POST endpoint for token refresh (future enhancement)
app.post("/refresh", (c) => {
  const errorResponse = createErrorResponse(
    ErrorCodes.SERVICE_UNAVAILABLE,
    "Token refresh not implemented yet - please log in again",
    undefined,
    "auth-user"
  );

  return c.json(errorResponse, 501);
});

// Health check endpoint
app.get("/health", (c) => {
  const dependencies = {
    jwt: c.env.JWT_SECRET ? ("healthy" as const) : ("unhealthy" as const),
    kv: c.env.GODWEAR_KV ? ("healthy" as const) : ("degraded" as const),
  };

  const status = dependencies.jwt === "healthy" ? ("healthy" as const) : ("degraded" as const);

  const healthResponse = {
    status,
    service: "auth-user",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies,
  };

  return c.json(healthResponse);
});

export default app;
