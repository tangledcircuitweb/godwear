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
   * Process OAuth callback and create/update user
   */
  async processOAuthCallback(code: string, request: Request): Promise<AuthResult> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code, request);

    // Get user info
    const userInfo = await this.getUserInfo(tokens.access_token);

    // Check if user exists in database
    const existingUser = await this.findUserByEmail(userInfo.email);
    const isNewUser = !existingUser;

    // Create or update user
    const user = isNewUser
      ? await this.createUser(userInfo)
      : await this.updateUser(existingUser.id, userInfo);

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
   * Find user by email in database
   */
  private async findUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const result = await this.env.DB.prepare(
        "SELECT id, email, name, picture, verified_email FROM users WHERE email = ?"
      )
        .bind(email)
        .first();

      if (!result) return null;

      return {
        id: result["id"] as string,
        email: result["email"] as string,
        name: result["name"] as string,
        picture: result["picture"] as string | undefined,
        verified_email: result["verified_email"] as boolean | undefined,
      };
    } catch (error) {
      this.logger?.error("Database query failed", error as Error);
      throw new Error("Database query failed");
    }
  }

  /**
   * Create new user in database
   */
  private async createUser(userInfo: GoogleUserInfo): Promise<AuthUser> {
    try {
      const userId = crypto.randomUUID();

      await this.env.DB.prepare(`
        INSERT INTO users (id, email, name, picture, verified_email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
        .bind(
          userId,
          userInfo.email,
          userInfo.name,
          userInfo.picture ?? null,
          userInfo.verified_email ?? false
        )
        .run();

      return {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      };
    } catch (error) {
      this.logger?.error("User creation failed", error as Error);
      throw new Error("User creation failed");
    }
  }

  /**
   * Update existing user in database
   */
  private async updateUser(userId: string, userInfo: GoogleUserInfo): Promise<AuthUser> {
    try {
      await this.env.DB.prepare(`
        UPDATE users 
        SET name = ?, picture = ?, verified_email = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
        .bind(userInfo.name, userInfo.picture ?? null, userInfo.verified_email ?? false, userId)
        .run();

      return {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      };
    } catch (error) {
      this.logger?.error("User update failed", error as Error);
      throw new Error("User update failed");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    return this.findUserByEmail(""); // This would need to be implemented properly
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    // In a more complex system, you might want to maintain a blacklist of tokens
    // For now, we rely on client-side token removal
    this.logger?.info("User logged out", { userId });
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
