import type { z } from "zod";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";

// Define the schemas in the implementation file and reference them here
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string | undefined;
    verifiedEmail?: boolean | undefined;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string | undefined;
    expiresIn?: number;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    tokens?: AuthTokens;
    isNewUser?: boolean;
    error?: string;
}

// JWT Payload type - will be defined with Zod in the implementation file
export interface JWTPayload {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}

// Google API response types - will be defined with Zod in the implementation file
export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
}

/**
 * Authentication service handling OAuth flows and JWT operations
 */
export declare class AuthService implements BaseService {
    readonly serviceName: string;
    private env;
    private logger?;
    initialize(dependencies: ServiceDependencies): void;
    /**
     * Get the appropriate redirect URI based on environment
     */
    getRedirectUri(request: Request): string;
    /**
     * Generate Google OAuth URL
     */
    generateGoogleOAuthUrl(request: Request, state?: string): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code: string, request: Request): Promise<GoogleTokenResponse>;
    /**
     * Get user info from Google
     */
    getUserInfo(accessToken: string): Promise<GoogleUserInfo>;
    /**
     * Alias for getUserInfo for backward compatibility
     */
    fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo>;
    /**
     * Generate JWT token with proper security claims
     */
    generateJWT(userOrPayload: JWTPayload | Record<string, unknown>): Promise<string>;
    /**
     * Verify JWT token
     */
    verifyJWT(token: string): Promise<{
        valid: boolean;
        payload?: JWTPayload;
        error?: string;
    }>;
    /**
     * Process OAuth callback and create/update user using repository pattern
     */
    processOAuthCallback(code: string, request: Request): Promise<{
        success: boolean;
        user?: AuthUser;
        tokens?: AuthTokens;
        isNewUser?: boolean;
        error?: string;
    }>;
    /**
     * Get repository registry from service dependencies
     * Note: This is a temporary solution until we implement proper dependency injection
     */
    private getRepositories;
    /**
     * Create new user using repository pattern
     */
    private createUserWithRepository;
    /**
     * Update existing user using repository pattern
     */
    private updateUserWithRepository;
    /**
     * Get user by ID using repository pattern
     */
    getUserById(userId: string): Promise<AuthUser | null>;
    /**
     * Validate session token and return boolean result
     */
    validateSession(token: string, sessionId?: string): Promise<boolean>;
    /**
     * Get user info from valid session token
     */
    getUserFromSession(token: string, sessionId?: string): Promise<AuthUser | null>;
    /**
     * Invalidate session (logout)
     */
    invalidateSession(sessionId: string): Promise<void>;
    /**
     * Hash token for secure storage
     */
    private hashToken;
    /**
     * Health check for authentication service
     */
    healthCheck(): Promise<ServiceHealthStatus>;
    /**
     * Create secure session - Professional implementation
     */
    createSession(user: AuthUser): Promise<string>;
    /**
     * Check if session is valid - Professional implementation
     */
    isValidSession(sessionId: string): Promise<boolean>;
    /**
     * Destroy session - Professional implementation
     */
    destroySession(sessionId: string): Promise<void>;
    /**
     * Get health status - Professional implementation
     */
    getHealth(): Promise<ServiceHealthStatus & {
        service?: string;
        timestamp?: string;
    }>;
}