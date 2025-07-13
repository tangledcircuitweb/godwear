import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import type { JWTHeader, JWTPayload } from "../../../../types/auth";
import type { CloudflareBindings } from "../../../../types/cloudflare";
import {
  OAuthCallbackSchema,
  OAuthErrorSchema,
  GoogleTokenResponseSchema,
  GoogleUserInfoSchema,
  type GoogleTokenResponse,
  type GoogleUserInfo,
  type OAuthCallback,
  type ApiResponse,
} from "../../../../types/validation";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Helper function to determine redirect URI based on environment
function getRedirectUri(request: Request, env: CloudflareBindings): string {
  const url = new URL(request.url);

  if (env.NODE_ENV === "production" && env.PRODUCTION_DOMAIN) {
    return `https://${env.PRODUCTION_DOMAIN}/api/auth/callback`;
  }
  if (env.NODE_ENV === "staging" && env.STAGING_DOMAIN) {
    return `https://${env.STAGING_DOMAIN}/api/auth/callback`;
  }
  if (env.DEVELOPMENT_DOMAIN) {
    return `https://${env.DEVELOPMENT_DOMAIN}/api/auth/callback`;
  }

  // Fallback to current origin
  return `${url.origin}/api/auth/callback`;
}

// Helper function to generate JWT
async function generateJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header: JWTHeader = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${encodedSignature}`;
}

// Helper function to verify state parameter
function verifyState(storedState: string | undefined, receivedState: string) {
  if (!storedState || storedState !== receivedState) {
    return { valid: false, redirectUrl: "/?error=state_mismatch" };
  }
  return { valid: true };
}

// Helper function to exchange code for tokens
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  env: CloudflareBindings
): Promise<{ success: boolean; tokens?: GoogleTokenResponse; redirectUrl?: string }> {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      return { success: false, redirectUrl: "/?error=token_exchange_failed" };
    }

    const rawTokens = await tokenResponse.json();
    
    // Validate token response with Zod
    const validationResult = GoogleTokenResponseSchema.safeParse(rawTokens);
    if (!validationResult.success) {
      console.error("Invalid token response:", validationResult.error);
      return { success: false, redirectUrl: "/?error=invalid_token_response" };
    }

    return { success: true, tokens: validationResult.data };
  } catch (error) {
    console.error("Token exchange error:", error);
    return { success: false, redirectUrl: "/?error=token_exchange_failed" };
  }
}

// Helper function to get user info from Google
async function getUserInfo(
  accessToken: string
): Promise<{ success: boolean; userInfo?: GoogleUserInfo; redirectUrl?: string }> {
  try {
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return { success: false, redirectUrl: "/?error=user_info_failed" };
    }

    const rawUserInfo = await userResponse.json();
    
    // Validate user info response with Zod
    const validationResult = GoogleUserInfoSchema.safeParse(rawUserInfo);
    if (!validationResult.success) {
      console.error("Invalid user info response:", validationResult.error);
      return { success: false, redirectUrl: "/?error=invalid_user_info" };
    }

    const userInfo = validationResult.data;

    if (!userInfo.verified_email) {
      return { success: false, redirectUrl: "/?error=email_not_verified" };
    }

    return { success: true, userInfo };
  } catch (error) {
    console.error("User info fetch error:", error);
    return { success: false, redirectUrl: "/?error=user_info_failed" };
  }
}

// Helper function to store user session
async function storeUserSession(userInfo: GoogleUserInfo, env: CloudflareBindings, origin: string) {
  const now = Math.floor(Date.now() / 1000);
  const sessionPayload: JWTPayload = {
    sub: userInfo.id, // Standard JWT subject claim
    email: userInfo.email,
    name: userInfo.name,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
    iss: origin, // Issuer
    aud: "godwear-app", // Audience
  };

  // Only add picture if it exists
  if (userInfo.picture) {
    sessionPayload.picture = userInfo.picture;
  }

  const sessionToken = await generateJWT(sessionPayload, env.JWT_SECRET);

  // Store user in KV for quick access (optional)
  if (env.GODWEAR_KV) {
    await env.GODWEAR_KV.put(
      `user:${userInfo.id}`,
      JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        lastLogin: new Date().toISOString(),
      }),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );
  }

  return sessionToken;
}

// Helper function to send welcome email
async function sendWelcomeEmail(userInfo: GoogleUserInfo, origin: string, env: CloudflareBindings) {
  try {
    if (env.MAILERSEND_API_KEY) {
      await fetch(`${origin}/api/email/mailersend/welcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.given_name || userInfo.name,
        }),
      });
    }
  } catch (_emailError) {
    // Don't fail the authentication if email fails
  }
}

app.get("/", 
  zValidator("query", OAuthCallbackSchema.or(OAuthErrorSchema)),
  async (c) => {
    try {
      // Check for required environment variables
      if (!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET && c.env.JWT_SECRET)) {
        return c.redirect("/?error=configuration_error");
      }

      const queryParams = c.req.valid("query");

      // Handle OAuth error responses
      if ("error" in queryParams) {
        console.error("OAuth error:", queryParams.error, queryParams.error_description);
        return c.redirect(`/?error=${queryParams.error}`);
      }

      // At this point, we know we have a valid OAuth callback
      const { code, state } = queryParams as OAuthCallback;

      // Verify state parameter
    const storedState = getCookie(c, "oauth_state");
    if (!state) {
      return c.redirect("/?error=missing_state");
    }
    const stateValidation = verifyState(storedState, state);
    if (!stateValidation.valid) {
      return c.redirect(stateValidation.redirectUrl || "/?error=state_validation_failed");
    }

    // Get stored code verifier
    const codeVerifier = getCookie(c, "oauth_code_verifier");
    if (!codeVerifier) {
      return c.redirect("/?error=missing_code_verifier");
    }

    // Clean up OAuth cookies
    deleteCookie(c, "oauth_state", { path: "/api/auth" });
    deleteCookie(c, "oauth_code_verifier", { path: "/api/auth" });

    // Exchange authorization code for tokens
    const redirectUri = getRedirectUri(c.req.raw, c.env);
    if (!code) {
      return c.redirect("/?error=missing_code");
    }
    const tokenResult = await exchangeCodeForTokens(code, codeVerifier, redirectUri, c.env);
    if (!tokenResult.success) {
      return c.redirect(tokenResult.redirectUrl || "/?error=token_exchange_failed");
    }

    // Get user information
    if (!tokenResult.tokens?.access_token) {
      return c.redirect("/?error=missing_access_token");
    }
    const userResult = await getUserInfo(tokenResult.tokens.access_token);
    if (!userResult.success) {
      return c.redirect(userResult.redirectUrl || "/?error=user_info_failed");
    }

    // Store user session
    if (!userResult.userInfo) {
      return c.redirect("/?error=missing_user_info");
    }
    const origin = new URL(c.req.url).origin;
    const sessionToken = await storeUserSession(userResult.userInfo, c.env, origin);

    // Set secure session cookie
    setCookie(c, "session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Send welcome email for new users
    await sendWelcomeEmail(userResult.userInfo, origin, c.env);

    // Redirect to success page or dashboard
    const welcomeName = userResult.userInfo.given_name || userResult.userInfo.name || "User";
    return c.redirect(`/?auth=success&welcome=${encodeURIComponent(welcomeName)}`);
  } catch (error) {
    return c.redirect(
      "/?error=callback_failed&message=" +
        encodeURIComponent(error instanceof Error ? error.message : "Unknown error")
    );
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "oauth-callback",
    timestamp: new Date().toISOString(),
    hasClientId: !!c.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!c.env.JWT_SECRET,
  });
});

export default app;
