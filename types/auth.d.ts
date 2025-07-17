export interface JWTPayload {
    sub: string;
    email: string;
    name: string;
    picture?: string | undefined;
    email_verified?: boolean | undefined;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export interface JWTHeader {
    alg: string;
    typ: string;
}
export interface UserSession {
    userId: string;
    email: string;
    name: string;
    isAuthenticated: boolean;
}
export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: UserSession;
    redirectUrl?: string;
}
//# sourceMappingURL=auth.d.ts.map