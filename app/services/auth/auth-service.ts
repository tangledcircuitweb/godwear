import type { JWTHeader, JWTPayload } from "../../../types/auth";
import type { CloudflareBindings } from "../../../types/cloudflare";
import type { GoogleTokenResponse, GoogleUserInfo } from "../../../types/validation";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  verified_email?: boolean | undefined;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn?: number;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
  isNewUser: boolean;
}

/**
 * Authentication service handling OAuth flows and JWT operations
 */
export class AuthService implements BaseService {
  readonly serviceName = "auth-service";

  private env!: CloudflareBindings;
  private logger?: any;

  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
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

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      this.logger?.error("Token exchange failed", new Error(errorText));
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    return (await tokenResponse.json()) as GoogleTokenResponse;
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      this.logger?.error("User info fetch failed", new Error(errorText));
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    return (await userResponse.json()) as GoogleUserInfo;
  }

  /**
   * Generate JWT token
   */
  async generateJWT(payload: JWTPayload): Promise<string> {
    if (!this.env.JWT_SECRET) {
      throw new Error("JWT secret not configured");
    }

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
      encoder.encode(this.env.JWT_SECRET!),
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
  async verifyJWT(token: string): Promise<JWTPayload> {
    if (!this.env.JWT_SECRET) {
      throw new Error("JWT secret not configured");
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const encodedHeader = parts[0]!;
    const encodedPayload = parts[1]!;
    const encodedSignature = parts[2]!;

    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.env.JWT_SECRET!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = new Uint8Array(
      atob(encodedSignature)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));

    if (!isValid) {
      throw new Error("Invalid JWT signature");
    }

    // Parse payload
    const payload = JSON.parse(atob(encodedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw new Error("JWT token expired");
    }

    return payload;
  }

  /**
   * Process OAuth callback and create/update user using repository pattern
   */
  async processOAuthCallback(code: string, request: Request): Promise<AuthResult> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code, request);

    // Get user info
    const userInfo = await this.getUserInfo(tokens.access_token);

    // Get repository registry from service dependencies
    const repositories = this.getRepositories();

    // Check if user exists in database using repository
    const existingUser = await repositories.user.findByEmail(userInfo.email);
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
      user,
      tokens: {
        accessToken,
        refreshToken: tokens.refresh_token,
        expiresIn: 24 * 60 * 60, // 24 hours
      },
      isNewUser,
    };
  }

  /**
   * Get repository registry from service dependencies
   * Note: This is a temporary solution until we implement proper dependency injection
   */
  private getRepositories() {
    // Import here to avoid circular dependencies
    const { createServiceRegistry } = require("../registry");
    const services = createServiceRegistry({
      env: this.env,
      request: new Request("http://localhost"),
    });
    return services.database.repositories;
  }

  /**
   * Create new user using repository pattern
   */
  private async createUserWithRepository(
    userInfo: GoogleUserInfo,
    repositories: any
  ): Promise<AuthUser> {
    try {
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const userRecord = await repositories.user.create({
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture ?? null,
        verified_email: userInfo.verified_email ?? false,
        status: "active",
        created_at: now,
        updated_at: now,
      });

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verified_email: userRecord.verified_email ?? undefined,
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
    repositories: any
  ): Promise<AuthUser> {
    try {
      const now = new Date().toISOString();

      const userRecord = await repositories.user.update(userId, {
        name: userInfo.name,
        picture: userInfo.picture ?? null,
        verified_email: userInfo.verified_email ?? false,
        last_login_at: now,
        updated_at: now,
      });

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verified_email: userRecord.verified_email ?? undefined,
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
      const userRecord = await repositories.user.findById(userId);

      if (!userRecord) {
        return null;
      }

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture ?? undefined,
        verified_email: userRecord.verified_email ?? undefined,
      };
    } catch (error) {
      this.logger?.error("Failed to get user by ID", error as Error);
      throw new Error("Failed to get user by ID");
    }
  }

  /**
   * Validate session token and return user info
   */
  async validateSession(token: string, sessionId?: string): Promise<AuthUser | null> {
    try {
      // Verify JWT token
      const payload = await this.verifyJWT(token);

      // If session ID is provided, validate it in database
      if (sessionId) {
        const repositories = this.getRepositories();
        const session = await repositories.session.findById(sessionId);

        if (!session?.is_active || new Date(session.expires_at) < new Date()) {
          return null;
        }

        // Verify token hash matches
        const tokenHash = await this.hashToken(token);
        if (session.token_hash !== tokenHash) {
          return null;
        }
      }

      // Get user by ID from JWT payload
      return this.getUserById(payload.sub);
    } catch (error) {
      this.logger?.error("Session validation failed", error as Error);
      return null;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const repositories = this.getRepositories();
      await repositories.session.update(sessionId, {
        is_active: false,
        updated_at: new Date().toISOString(),
      });
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
}
