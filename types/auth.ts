export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
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
