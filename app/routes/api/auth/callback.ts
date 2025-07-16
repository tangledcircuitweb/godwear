import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  type AuthSuccessResponse,
  createErrorResponse,
  createSuccessResponse,
  type ErrorCode,
  ErrorCodes,
} from "../../../../types/api-responses";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import { OAuthCallbackSchema, OAuthErrorSchema } from "../../../../types/validation";
import { createServiceRegistry } from "../../../services";

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Enhanced OAuth callback handler with comprehensive database integration
 * GET /api/auth/callback
 *
 * Features:
 * - OAuth provider response handling (success/error)
 * - State parameter validation for CSRF protection
 * - Token exchange and user info retrieval
 * - Database integration using repository pattern
 * - Session management with database tracking
 * - Audit logging for security events
 * - Welcome email for new users
 * - Comprehensive error handling and cleanup
 */
app.get("/", zValidator("query", OAuthCallbackSchema.or(OAuthErrorSchema)), async (c) => {
  const env = c.env as CloudflareBindings;
  const clientIp = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const userAgent = c.req.header("User-Agent") || "unknown";

  // Initialize services with database integration
  const services = createServiceRegistry({
    env,
    request: c.req.raw,
  });

  try {
    const query = c.req.valid("query");

    // Handle OAuth error responses
    if ("error" in query) {
      deleteCookie(c, "oauth_state");

      // Log OAuth error for security monitoring
      await services.repositories.getAuditLogRepository().create({
        user_id: null,
        action: "oauth_error",
        resource_type: "auth",
        resource_id: null,
        old_values: JSON.stringify({
          error: query.error,
          error_description: query.error_description,
          ip_address: clientIp,
          user_agent: userAgent,
        }),
        ip_address: clientIp,
        user_agent: userAgent,
      });

      const errorResponse = createErrorResponse(
        ErrorCodes.AUTH_OAUTH_ERROR,
        `OAuth error: ${query.error}`,
        {
          error: query.error,
          description: query.error_description,
          provider: "google",
        },
        "auth-callback"
      );

      return c.json(errorResponse, 400);
    }

    // Verify state parameter for CSRF protection
    const storedState = getCookie(c, "oauth_state");
    if (!storedState || storedState !== query.state) {
      deleteCookie(c, "oauth_state");

      // Log state mismatch for security monitoring
      await services.repositories.getAuditLogRepository().create({
        user_id: null,
        action: "oauth_state_mismatch",
        resource_type: "auth",
        resource_id: null,
        old_values: JSON.stringify({
          provided_state: query.state,
          expected_state: storedState,
          ip_address: clientIp,
          user_agent: userAgent,
        }),
        ip_address: clientIp,
        user_agent: userAgent,
      });

      const errorResponse = createErrorResponse(
        ErrorCodes.AUTH_INVALID_STATE,
        "Invalid OAuth state parameter - possible CSRF attack",
        {
          securityNote: "This request may be from an unauthorized source",
        },
        "auth-callback"
      );

      return c.json(errorResponse, 400);
    }

    // Clean up state cookie
    deleteCookie(c, "oauth_state");

    // Process OAuth callback with enhanced error handling
    const authResult = await services.auth.processOAuthCallback(query.code, c.req.raw);

    // Check if authentication was successful
    if (!authResult.success || !authResult.user || !authResult.tokens) {
      console.error("Authentication failed:", authResult.error || "Unknown error");
      return c.redirect("/auth/error?error=auth_failed");
    }

    // Create or update session in database
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 24); // 24 hours

    const sessionRecord = await services.repositories.getSessionRepository().create({
      user_id: authResult.user.id,
      token_hash: await hashToken(authResult.tokens.accessToken),
      expires_at: sessionExpiry.toISOString(),
      ip_address: clientIp,
      user_agent: userAgent,
      is_active: true,
    });

    const sessionId = sessionRecord.id;

    // Update user's last login timestamp
    await services.repositories.getUserRepository().updateLastLogin(authResult.user.id);

    // Set secure JWT cookie with session tracking
    setCookie(c, "auth_token", authResult.tokens.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: authResult.tokens.expiresIn || 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Set session ID cookie for session management
    setCookie(c, "session_id", sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Log successful authentication
    await services.repositories.getAuditLogRepository().create({
      user_id: authResult.user.id,
      action: authResult.isNewUser ? "user_registered" : "user_login",
      resource_type: "auth",
      resource_id: authResult.user.id,
      new_values: JSON.stringify({
        provider: "google",
        session_id: sessionId,
        is_new_user: authResult.isNewUser || false,
        ip_address: clientIp,
        user_agent: userAgent,
      }),
      ip_address: clientIp,
      user_agent: userAgent,
    });

    // Send welcome email for new users with error handling
    if (authResult.isNewUser) {
      try {
        await services.notifications.sendWelcomeEmail({
          email: authResult.user.email,
          name: authResult.user.name,
        });

        // Log successful welcome email
        await services.repositories.getAuditLogRepository().create({
          user_id: authResult.user.id,
          action: "welcome_email_sent",
          resource_type: "email",
          resource_id: authResult.user.email,
          new_values: JSON.stringify({
            email_type: "welcome",
            recipient: authResult.user.email,
          }),
          ip_address: clientIp,
          user_agent: userAgent,
        });
      } catch (emailError) {
        await services.repositories.getAuditLogRepository().create({
          user_id: authResult.user.id,
          action: "welcome_email_failed",
          resource_type: "email",
          resource_id: authResult.user.email,
          old_values: JSON.stringify({
            error: emailError instanceof Error ? emailError.message : "Unknown error",
            email_type: "welcome",
            recipient: authResult.user.email,
          }),
          ip_address: clientIp,
          user_agent: userAgent,
        });
      }
    }

    // Prepare enhanced response data
    const responseData: AuthSuccessResponse = {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        ...(authResult.user.picture && { picture: authResult.user.picture }),
      },
      isNewUser: authResult.isNewUser || false,
    };

    const successResponse = createSuccessResponse(responseData, {
      service: "auth-callback",
      version: "2.0.0",
      requestId: sessionId,
    });

    return c.json(successResponse);
  } catch (error) {
    // Clean up cookies on error
    deleteCookie(c, "oauth_state");
    deleteCookie(c, "auth_token");
    deleteCookie(c, "session_id");

    // Enhanced error categorization
    let errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
    let errorMessage = "Authentication failed";
    let statusCode = 500;
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      if (error.message.includes("Token exchange failed")) {
        errorCode = ErrorCodes.AUTH_TOKEN_EXCHANGE_FAILED;
        errorMessage = "Failed to exchange authorization code for tokens";
        statusCode = 400;
        errorDetails = { step: "token_exchange", provider: "google" };
      } else if (error.message.includes("User info fetch failed")) {
        errorCode = ErrorCodes.AUTH_USER_INFO_FAILED;
        errorMessage = "Failed to fetch user information from provider";
        statusCode = 400;
        errorDetails = { step: "user_info_fetch", provider: "google" };
      } else if (error.message.includes("Database") || error.message.includes("repository")) {
        errorCode = ErrorCodes.DATABASE_QUERY_ERROR;
        errorMessage = "Database operation failed during authentication";
        statusCode = 500;
        errorDetails = { step: "database_operation" };
      } else if (error.message.includes("JWT")) {
        errorCode = ErrorCodes.AUTH_TOKEN_EXPIRED;
        errorMessage = "JWT token generation failed";
        statusCode = 500;
        errorDetails = { step: "jwt_generation" };
      }

      errorDetails["originalError"] = error.message;
    }

    // Log authentication failure for security monitoring
    try {
      await services.repositories.getAuditLogRepository().create({
        user_id: null,
        action: "auth_callback_failed",
        resource_type: "auth",
        resource_id: null,
        old_values: JSON.stringify({
          error_code: errorCode,
          error_message: errorMessage,
          error_details: errorDetails,
          ip_address: clientIp,
          user_agent: userAgent,
        }),
        ip_address: clientIp,
        user_agent: userAgent,
      });
    } catch (_auditError) {}

    const errorResponse = createErrorResponse(
      errorCode,
      errorMessage,
      errorDetails,
      "auth-callback"
    );

    return c.json(errorResponse, statusCode as 400 | 500);
  }
});

/**
 * Hash token for secure storage in database
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default app;
