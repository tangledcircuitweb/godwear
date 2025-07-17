export interface JWTPayload {
  sub: string; // User ID (standard JWT claim)
  email: string;
  name: string;
  picture?: string | undefined;
  email_verified?: boolean | undefined;
  iat: number;
  exp: number;
  iss: string; // Issuer
  aud: string; // Audience
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
