import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { JWTHeader, JWTPayload } from "../../../../types/auth";
import type { CloudflareBindings } from "../../../../types/cloudflare";

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

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

// Helper function to validate OAuth parameters
function validateOAuthParams(
  code: string | undefined,
  state: string | undefined,
  error: string | undefined
) {
  if (error) {
    return {
      valid: false,
      redirectUrl: `/?error=oauth_error&message=${encodeURIComponent(error)}`,
    };
  }

  if (!(code && state)) {
    return { valid: false, redirectUrl: "/?error=missing_parameters" };
  }

  return { valid: true };
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

  const tokens: GoogleTokenResponse = await tokenResponse.json();
  return { success: true, tokens };
}

// Helper function to get user info from Google
async function getUserInfo(
  accessToken: string
): Promise<{ success: boolean; userInfo?: GoogleUserInfo; redirectUrl?: string }> {
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return { success: false, redirectUrl: "/?error=user_info_failed" };
  }

  const userInfo: GoogleUserInfo = await userResponse.json();

  if (!userInfo.verified_email) {
    return { success: false, redirectUrl: "/?error=email_not_verified" };
  }

  return { success: true, userInfo };
}

// Helper function to store user session
async function storeUserSession(userInfo: GoogleUserInfo, env: CloudflareBindings) {
  const sessionPayload = {
    userId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

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

app.get("/", async (c) => {
  try {
    // Check for required environment variables
    if (!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET && c.env.JWT_SECRET)) {
      return c.redirect("/?error=configuration_error");
    }

    // Get query parameters
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    // Validate OAuth parameters
    const paramValidation = validateOAuthParams(code, state, error);
    if (!paramValidation.valid) {
      return c.redirect(paramValidation.redirectUrl || "/?error=validation_failed");
    }

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
    const sessionToken = await storeUserSession(userResult.userInfo, c.env);

    // Set secure session cookie
    setCookie(c, "session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Send welcome email for new users
    await sendWelcomeEmail(userResult.userInfo, new URL(c.req.url).origin, c.env);

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
