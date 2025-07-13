import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  OAuthCallbackSchema,
  OAuthErrorSchema,
  type OAuthCallback,
} from "../../../../types/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type AuthSuccessResponse,
  type ErrorCode,
} from "../../../../types/api-responses";
import { createServiceRegistry } from "../../../services";

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * OAuth callback handler
 * GET /api/auth/callback
 */
app.get("/", 
  zValidator("query", OAuthCallbackSchema.or(OAuthErrorSchema)),
  async (c) => {
    const env = c.env as CloudflareBindings;
    
    // Initialize services
    const services = createServiceRegistry({
      env,
      request: c.req.raw,
    });

    try {
      const query = c.req.valid("query");

      // Handle OAuth error
      if ("error" in query) {
        deleteCookie(c, "oauth_state");
        
        const errorResponse = createErrorResponse(
          ErrorCodes.AUTH_OAUTH_ERROR,
          `OAuth error: ${query.error}`,
          {
            error: query.error,
            description: query.error_description,
          },
          "auth-callback"
        );

        return c.json(errorResponse, 400);
      }

      // Verify state parameter
      const storedState = getCookie(c, "oauth_state");
      if (!storedState || storedState !== query.state) {
        deleteCookie(c, "oauth_state");
        
        const errorResponse = createErrorResponse(
          ErrorCodes.AUTH_INVALID_STATE,
          "Invalid OAuth state parameter",
          undefined,
          "auth-callback"
        );

        return c.json(errorResponse, 400);
      }

      // Clean up state cookie
      deleteCookie(c, "oauth_state");

      // Process OAuth callback using service layer
      const authResult = await services.auth.processOAuthCallback(query.code, c.req.raw);

      // Set JWT cookie
      setCookie(c, "auth_token", authResult.tokens.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: authResult.tokens.expiresIn || 24 * 60 * 60, // 24 hours
        path: "/",
      });

      // Send welcome email for new users
      if (authResult.isNewUser) {
        try {
          await services.notifications.sendWelcomeEmail({
            email: authResult.user.email,
            name: authResult.user.name,
          });
        } catch (emailError) {
          // Log email error but don't fail the authentication
          console.error("Welcome email failed:", emailError);
        }
      }

      // Prepare response data
      const responseData: AuthSuccessResponse = {
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          ...(authResult.user.picture && { picture: authResult.user.picture }),
        },
        isNewUser: authResult.isNewUser,
      };

      const successResponse = createSuccessResponse(responseData, {
        service: "auth-callback",
        version: "1.0.0",
      });

      return c.json(successResponse);
    } catch (error) {
      // Clean up cookies on error
      deleteCookie(c, "oauth_state");
      deleteCookie(c, "auth_token");

      let errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
      let errorMessage = "Authentication failed";
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes("Token exchange failed")) {
          errorCode = ErrorCodes.AUTH_TOKEN_EXCHANGE_FAILED;
          errorMessage = "Failed to exchange authorization code";
          statusCode = 400;
        } else if (error.message.includes("User info fetch failed")) {
          errorCode = ErrorCodes.AUTH_USER_INFO_FAILED;
          errorMessage = "Failed to fetch user information";
          statusCode = 400;
        } else if (error.message.includes("Database")) {
          errorCode = ErrorCodes.DATABASE_QUERY_ERROR;
          errorMessage = "Database operation failed";
          statusCode = 500;
        }
      }

      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        {
          originalError: error instanceof Error ? error.message : "Unknown error",
        },
        "auth-callback"
      );

      return c.json(errorResponse, statusCode as 400 | 500);
    }
  }
);

export default app;
