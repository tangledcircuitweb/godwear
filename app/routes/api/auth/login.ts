import { createRoute } from "honox/factory";
import { setCookie } from "hono/cookie";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type LoginResponse,
} from "../../../../types/api-responses";
import { createServiceRegistry } from "../../../services";

/**
 * Initiate OAuth login
 * GET /api/auth/login
 */
export default createRoute(async (c) => {
  const env = c.env as CloudflareBindings;

  // Initialize services
  const services = createServiceRegistry({
    env,
    request: c.req.raw,
  });

  try {
    // Check if required OAuth configuration is available
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SERVICE_CONFIGURATION_ERROR,
        "OAuth configuration not available",
        undefined,
        "auth-login"
      );
      return c.json(errorResponse, 500);
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Set state cookie
    setCookie(c, "oauth_state", state, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    // Generate OAuth URL using service layer
    const oauthUrl = services.auth.generateGoogleOAuthUrl(c.req.raw, state);

    const responseData: LoginResponse = {
      redirectUrl: oauthUrl,
      provider: "google",
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "auth-login",
      version: "1.0.0",
    });

    return c.json(successResponse);
  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Failed to initiate login",
      {
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      "auth-login"
    );

    return c.json(errorResponse, 500);
  }
});
