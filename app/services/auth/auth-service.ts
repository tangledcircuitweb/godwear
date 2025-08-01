import { z } from "zod";
import type { CloudflareBindings } from "../../lib/zod-utils";
import type { BaseService, ServiceDependencies, ServiceHealthStatus, ServiceLogger } from "../base";
import { D1DatabaseService, RepositoryRegistry } from "../database";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * JWT Header schema
 */
const JWTHeaderSchema = z.object({
  alg: z.string(),
  typ: z.string(),
});

/**
 * JWT Payload schema
 */
const JWTPayloadSchema = z.object({
  sub: z.string(), // User ID (standard JWT claim)
  email: z.string(),
  name: z.string(),
  picture: z.string().optional(),
  email_verified: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(), // Issuer
  aud: z.string(), // Audience
  jti: z.string().optional(), // JWT ID for uniqueness
});

/**
 * Auth User schema
 */
const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  picture: z.string().optional(),
  verifiedEmail: z.boolean().optional(),
});

/**
 * Auth Tokens schema
 */
const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
});

/**
 * Auth Result schema
 */
const AuthResultSchema = z.object({
  success: z.boolean(),
  user: AuthUserSchema.optional(),
  tokens: AuthTokensSchema.optional(),
  isNewUser: z.boolean().optional(),
  error: z.string().optional(),
});

/**
 * Google Token Response schema
 */
const GoogleTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.literal("Bearer"),
  id_token: z.string(),
});

/**
 * Google User Info schema
 */
const GoogleUserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean(),
  verifiedEmail: z.boolean().optional().default(false),
  name: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type JWTHeader = z.infer<typeof JWTHeaderSchema>;
type JWTPayload = z.infer<typeof JWTPayloadSchema>;
type AuthUser = z.infer<typeof AuthUserSchema>;
type AuthTokens = z.infer<typeof AuthTokensSchema>;
type AuthResult = z.infer<typeof AuthResultSchema>;
type GoogleTokenResponse = z.infer<typeof GoogleTokenResponseSchema>;
type GoogleUserInfo = z.infer<typeof GoogleUserInfoSchema>;

// Export types for use in other files
export type { JWTHeader, JWTPayload, AuthUser, AuthTokens, AuthResult, GoogleTokenResponse, GoogleUserInfo };

/**
 * Authentication service handling OAuth flows and JWT operations
 */
export class AuthService implements BaseService {
  readonly serviceName = "auth-service";

  // Static schema exports
  static readonly JWTPayloadSchema = JWTPayloadSchema;
  static readonly JWTHeaderSchema = JWTHeaderSchema;
  static readonly AuthUserSchema = AuthUserSchema;
  static readonly AuthTokensSchema = AuthTokensSchema;
  static readonly AuthResultSchema = AuthResultSchema;
  static readonly GoogleTokenResponseSchema = GoogleTokenResponseSchema;
  static readonly GoogleUserInfoSchema = GoogleUserInfoSchema;

  private env!: CloudflareBindings;
  private logger?: ServiceLogger | undefined;

  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;

    // Validate required environment variables
    if (!this.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required for AuthService");
    }

    if (!(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET)) {
      throw new Error(
        "Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are required for AuthService"
      );
    }

    if (!this.env.DB) {
      throw new Error("Database connection (DB) is required for AuthService");
    }

    if (!this.env.SESSION_STORE) {
      throw new Error("Session store (SESSION_STORE) is required for AuthService");
    }
  }

  /**
   * Get the appropriate redirect URI based on environment
   */
  getRedirectUri(request: Request): string {
    const url = new URL(request.url);

    if (this.env.NODE_ENV === "production" && this.env.PRODUCTION_DOMAIN) {
      return `https://${this.env.PRODUCTION_DOMAIN}/api/auth/callback`;
    }
    if (this.env.NODE_ENV === "staging" && this.env.STAGING_DOMAIN) {
      return `https://${this.env.STAGING_DOMAIN}/api/auth/callback`;
    }
    if (this.env.DEVELOPMENT_DOMAIN) {
      return `https://${this.env.DEVELOPMENT_DOMAIN}/api/auth/callback`;
    }

    // Fallback to current origin
    return `${url.origin}/api/auth/callback`;
  }

  /**
   * Generate Google OAuth URL
   */
  generateGoogleOAuthUrl(request: Request, state?: string): string {
    if (!this.env.GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID not configured");
    }

    const redirectUri = this.getRedirectUri(request);
    const params = new URLSearchParams();

    params.set("client_id", this.env.GOOGLE_CLIENT_ID);
    params.set("redirect_uri", redirectUri);
    params.set("response_type", "code");
    params.set("scope", "openid email profile");
    params.set("access_type", "offline");
    params.set("prompt", "consent");

    if (state) {
      params.set("state", state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, request: Request): Promise<GoogleTokenResponse> {
    if (!(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET)) {
      throw new Error("Google OAuth credentials not configured");
    }

    const redirectUri = this.getRedirectUri(request);

    const params = new URLSearchParams();
    params.set("client_id", this.env.GOOGLE_CLIENT_ID);
    params.set("client_secret", this.env.GOOGLE_CLIENT_SECRET);
    params.set("code", code);
    params.set("grant_type", "authorization_code");
    params.set("redirect_uri", redirectUri);

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        try {
          const errorData = (await tokenResponse.json()) as Record<string, unknown>;
          this.logger?.error("Token exchange failed", new Error(JSON.stringify(errorData)));
          if (errorData && typeof errorData === "object" && "error" in errorData) {
            throw new Error(String(errorData["error"]));
          }
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        } catch (parseError) {
          // If it's already a thrown error from above, re-throw it
          if (parseError instanceof Error && parseError.message !== "Unexpected token") {
            throw parseError;
          }
          // If JSON parsing fails, use generic error
          this.logger?.error("Token exchange failed", new Error(`HTTP ${tokenResponse.status}`));
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }
      }

      return (await tokenResponse.json()) as GoogleTokenResponse;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        this.logger?.error("Network error during token exchange", error);
        throw new Error("Network error during token exchange");
      }
      throw error;
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        this.logger?.error("User info fetch failed", new Error(errorText));
        throw new Error("Failed to fetch user info");
      }

      const responseText = await userResponse.text();
      try {
        return JSON.parse(responseText) as GoogleUserInfo;
      } catch (parseError) {
        this.logger?.error("Failed to parse user info JSON", parseError as Error);
        throw new Error("Failed to parse user info response");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        this.logger?.error("Network error during user info fetch", error);
        throw new Error("Failed to fetch user info");
      }
      throw error;
    }
  }

  /**
   * Alias for getUserInfo for backward compatibility
   */
  fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    return this.getUserInfo(accessToken);
  }

  /**
   * Generate JWT token with proper security claims
   */
  async generateJWT(userOrPayload: JWTPayload | Record<string, unknown>): Promise<string> {
    if (!this.env.JWT_SECRET) {
      throw new Error("JWT secret not configured");
    }

    const now = Math.floor(Date.now() / 1000);
    const header: JWTHeader = {
      alg: "HS256",
      typ: "JWT",
    };

    // Handle both JWTPayload and user objects
    let payload: JWTPayload;
    if ("sub" in userOrPayload && "iat" in userOrPayload) {
      // Already a JWTPayload
      payload = userOrPayload as JWTPayload;
    } else {
      const user = userOrPayload as Record<string, unknown>;
      // Convert user object to JWTPayload
      payload = {
        sub: String(user["id"] || ""),
        email: String(user["email"] || ""),
        name: String(user["name"] || ""),
        picture: user["picture"] ? String(user["picture"]) : undefined,
        email_verified: Boolean(user["verified_email"] || user["email_verified"]),
        iat: now,
        exp: now + 24 * 60 * 60, // 24 hours
        aud: "godwear-app",
        iss: "godwear-auth-service",
      };
    }

    // Add required security claims if not present
    const securePayload = {
      ...payload,
      iat: payload.iat || now,
      exp: payload.exp || now + 24 * 60 * 60, // 24 hours
      aud: payload.aud || "godwear-app",
      iss: payload.iss || "godwear-auth-service",
      jti: crypto.randomUUID(), // Add unique JWT ID to ensure uniqueness
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(securePayload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();

    if (!this.env.JWT_SECRET) {
      throw new Error("JWT secret not configured");
    }

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    const signatureArray = new Uint8Array(signature);
    const encodedSignature = btoa(String.fromCharCode.apply(null, Array.from(signatureArray)));

    return `${data}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  async verifyJWT(
    token: string
  ): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
    try {
      if (!this.env.JWT_SECRET) {
        return { valid: false, error: "JWT secret not configured" };
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        return { valid: false, error: "Invalid JWT format" };
      }

      const encodedHeader = parts[0];
      const encodedPayload = parts[1];
      const encodedSignature = parts[2];

      // Verify signature
      const data = `${encodedHeader}.${encodedPayload}`;
      const encoder = new TextEncoder();

      if (!this.env.JWT_SECRET) {
        return { valid: false, error: "JWT secret not configured" };
      }

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(this.env.JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      if (!encodedSignature) {
        return { valid: false, error: "Invalid JWT signature format" };
      }

      const signature = new Uint8Array(
        atob(encodedSignature)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));

      if (!isValid) {
        return { valid: false, error: "Invalid JWT signature" };
      }

      // Parse payload
      if (!encodedPayload) {
        return { valid: false, error: "Invalid JWT payload format" };
      }

      const payload = JSON.parse(atob(encodedPayload)) as JWTPayload;

      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        return { valid: false, error: "JWT token expired" };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Process OAuth callback and create/update user using repository pattern
   */
  async processOAuthCallback(
    code: string,
    request: Request
  ): Promise<{
    success: boolean;
    user?: AuthUser;
    tokens?: AuthTokens;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, request);

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Get repository registry from service dependencies
      const repositories = this.getRepositories();

      // Check if user exists in database using repository
      const existingUser = await repositories.getUserRepository().findByEmail(userInfo.email);
      const isNewUser = !existingUser;

      // Create or update user using repository
      const user = isNewUser
        ? await this.createUserWithRepository(userInfo, repositories)
        : await this.updateUserWithRepository(existingUser.id, userInfo, repositories);

      // Generate JWT
      const jwtPayload: JWTPayload = {
        sub: user.id,
        iss: "godwear-auth",
        aud: "godwear-app",
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        iat: Math.floor(Date.now() / 1000),
        email: user.email,
        name: user.name,
      };

      const accessToken = await this.generateJWT(jwtPayload);

      return {
        success: true,
        user,
        tokens: {
          accessToken,
          refreshToken: tokens.refresh_token,
          expiresIn: 24 * 60 * 60, // 24 hours
        },
        isNewUser,
      };
    } catch (error) {
      this.logger?.error("OAuth callback processing failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "OAuth callback processing failed",
      };
    }
  }

  /**
   * Get repository registry from service dependencies
   * Note: This is a temporary solution until we implement proper dependency injection
   */
  private getRepositories() {
    // TODO: Implement proper dependency injection to avoid this pattern
    // For now, we'll create repositories directly
    const dbService = new D1DatabaseService();
    dbService.initialize({
      env: this.env,
      logger: this.logger,
    });
    return new RepositoryRegistry(dbService);
  }

  /**
   * Create new user using repository pattern
   */
  private async createUserWithRepository(
    userInfo: GoogleUserInfo,
    repositories: RepositoryRegistry
  ): Promise<AuthUser> {
    try {
      const userData = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture ?? null,
        verified_email: userInfo.verifiedEmail || userInfo.verified_email,
        provider: "google" as const,
        provider_id: userInfo.id,
        role: "USER" as const,
        status: "active" as const,
      };

      const userRecord = await repositories.getUserRepository().create(userData);

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verifiedEmail: userRecord.verified_email,
      };
    } catch (error) {
      this.logger?.error("User creation failed", error as Error);
      throw new Error("User creation failed");
    }
  }

  /**
   * Update existing user using repository pattern
   */
  private async updateUserWithRepository(
    userId: string,
    userInfo: GoogleUserInfo,
    repositories: RepositoryRegistry
  ): Promise<AuthUser> {
    try {
      const updateData = {
        name: userInfo.name,
        picture: userInfo.picture ?? null,
        email_verified: userInfo.verified_email ? 1 : 0,
        last_login_at: new Date().toISOString(),
      };

      const userRecord = await repositories.getUserRepository().update(userId, updateData);

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verifiedEmail: userRecord.verified_email,
      };
    } catch (error) {
      this.logger?.error("User update failed", error as Error);
      throw new Error("User update failed");
    }
  }

  /**
   * Get user by ID using repository pattern
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const repositories = this.getRepositories();
      const userRecord = await repositories.getUserRepository().findById(userId);

      if (!userRecord) {
        return null;
      }

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verifiedEmail: userRecord.verified_email ?? undefined,
      };
    } catch (error) {
      this.logger?.error("Failed to get user by ID", error as Error);
      throw new Error("Failed to get user by ID");
    }
  }

  /**
   * Validate session token and return boolean result
   */
  async validateSession(token: string, sessionId?: string): Promise<boolean> {
    try {
      // If no sessionId provided, just verify JWT token
      if (!sessionId) {
        const result = await this.verifyJWT(token);
        return result.valid;
      }

      // Check KV store first for fast validation
      const sessionData = await this.env.SESSION_STORE.get(sessionId);
      if (!sessionData) {
        return false;
      }

      const session = JSON.parse(sessionData);
      if (new Date(session.expiresAt) < new Date()) {
        return false;
      }

      // Verify JWT token
      const result = await this.verifyJWT(token);
      if (!(result.valid && result.payload)) {
        return false;
      }

      // Verify the session belongs to the user in the JWT
      if (result.payload.sub !== session.userId) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger?.error("Session validation failed", error as Error);
      return false;
    }
  }

  /**
   * Get user info from valid session token
   */
  async getUserFromSession(token: string, sessionId?: string): Promise<AuthUser | null> {
    try {
      const isValid = await this.validateSession(token, sessionId);
      if (!isValid) {
        return null;
      }

      // Verify JWT token to get payload
      const result = await this.verifyJWT(token);
      if (!(result.valid && result.payload)) {
        return null;
      }

      // Get user by ID from JWT payload
      return this.getUserById(result.payload.sub);
    } catch (error) {
      this.logger?.error("Get user from session failed", error as Error);
      return null;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const repositories = this.getRepositories();
      await repositories.getSessionRepository().update(sessionId, {
        is_active: false,
      });

      // Remove from KV store
      await this.env.SESSION_STORE.delete(sessionId);
    } catch (error) {
      this.logger?.error("Failed to invalidate session", error as Error);
      throw new Error("Failed to invalidate session");
    }
  }

  /**
   * Hash token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Health check for authentication service
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    const checks = {
      googleClientId: !!this.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!this.env.GOOGLE_CLIENT_SECRET,
      jwtSecret: !!this.env.JWT_SECRET,
      database: !!this.env.DB,
    };

    const unhealthyChecks = Object.entries(checks)
      .filter(([, isHealthy]) => !isHealthy)
      .map(([check]) => check);

    if (unhealthyChecks.length > 0) {
      return {
        status: "unhealthy",
        message: `Missing configuration: ${unhealthyChecks.join(", ")}`,
        details: checks,
      };
    }

    // Test database connection
    try {
      await this.env.DB.prepare("SELECT 1").first();
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database connection failed",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }

    return {
      status: "healthy",
      message: "Authentication service is operational",
      details: checks,
    };
  }

  /**
   * Create secure session - Professional implementation
   */
  async createSession(user: AuthUser): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const repositories = this.getRepositories();
    const sessionRecord = await repositories.getSessionRepository().create({
      user_id: user.id,
      token_hash: await this.hashToken(sessionId),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    const actualSessionId = sessionRecord.id;

    // Store session in KV for fast access
    await this.env.SESSION_STORE.put(
      actualSessionId,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        expirationTtl: 24 * 60 * 60, // 24 hours
      }
    );

    return actualSessionId;
  }

  /**
   * Check if session is valid - Professional implementation
   */
  async isValidSession(sessionId: string): Promise<boolean> {
    try {
      // Check KV store first (fast)
      const sessionData = await this.env.SESSION_STORE.get(sessionId);
      if (!sessionData) {
        return false;
      }

      const session = JSON.parse(sessionData);
      if (new Date(session.expiresAt) < new Date()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Destroy session - Professional implementation
   */
  async destroySession(sessionId: string): Promise<void> {
    // Remove from KV store
    await this.env.SESSION_STORE.delete(sessionId);

    // Mark as inactive in database
    const repositories = this.getRepositories();
    const session = await repositories.getSessionRepository().findById(sessionId);
    if (session) {
      await repositories.getSessionRepository().update(sessionId, {
        is_active: false,
      });
    }
  }

  /**
   * Get health status - Professional implementation
   */
  async getHealth(): Promise<ServiceHealthStatus & { service?: string; timestamp?: string }> {
    if (!this.env) {
      return {
        status: "unhealthy" as const,
        service: "auth-service",
        timestamp: new Date().toISOString(),
        message: "Service not initialized",
        details: { initialized: false },
      };
    }

    const checks = {
      jwtSecret: !!this.env.JWT_SECRET,
      googleOAuth: !!(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET),
      database: true,
      kvStore: true,
    };

    // Test database
    try {
      await this.env.DB.prepare("SELECT 1").first();
    } catch {
      checks.database = false;
    }

    // Test KV store
    try {
      await this.env.SESSION_STORE.get("health-check");
    } catch {
      checks.kvStore = false;
    }

    const isHealthy = Object.values(checks).every(Boolean);

    return {
      status: isHealthy ? ("healthy" as const) : ("unhealthy" as const),
      service: "auth-service",
      timestamp: new Date().toISOString(),
      message: isHealthy ? "All systems operational" : "Some systems are down",
      details: checks,
    };
  }
}
