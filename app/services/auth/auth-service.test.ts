import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth-service';
import type { AuthUser, AuthTokens, AuthResult } from './auth-service';
import type { ServiceDependencies } from '../base';
import { createMockEnv } from '../../../src/test/setup';
import { server } from '../../../src/test/setup';
import { http, HttpResponse } from 'msw';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDependencies: ServiceDependencies;

  beforeEach(() => {
    authService = new AuthService();
    mockDependencies = {
      env: createMockEnv(),
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
    };
    
    // Add additional environment variables for auth
    mockDependencies.env.NODE_ENV = 'test';
    mockDependencies.env.PRODUCTION_DOMAIN = 'godwear.com';
    mockDependencies.env.STAGING_DOMAIN = 'staging.godwear.com';
    
    authService.initialize(mockDependencies);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with dependencies', () => {
      expect(authService.serviceName).toBe('auth-service');
    });

    it('should store environment and logger references', () => {
      // Test that initialization worked by calling a method that uses env
      const mockRequest = new Request('http://localhost:3000/test');
      const redirectUri = authService.getRedirectUri(mockRequest);
      expect(redirectUri).toContain('/api/auth/callback');
    });
  });

  describe('getRedirectUri', () => {
    it('should return production URI for production environment', () => {
      mockDependencies.env.NODE_ENV = 'production';
      authService.initialize(mockDependencies);
      
      const mockRequest = new Request('http://localhost:3000/test');
      const redirectUri = authService.getRedirectUri(mockRequest);
      
      expect(redirectUri).toBe('https://godwear.com/api/auth/callback');
    });

    it('should return staging URI for staging environment', () => {
      mockDependencies.env.NODE_ENV = 'staging';
      authService.initialize(mockDependencies);
      
      const mockRequest = new Request('http://localhost:3000/test');
      const redirectUri = authService.getRedirectUri(mockRequest);
      
      expect(redirectUri).toBe('https://staging.godwear.com/api/auth/callback');
    });

    it('should return localhost URI for development environment', () => {
      mockDependencies.env.NODE_ENV = 'development';
      authService.initialize(mockDependencies);
      
      const mockRequest = new Request('http://localhost:3000/test');
      const redirectUri = authService.getRedirectUri(mockRequest);
      
      expect(redirectUri).toBe('http://localhost:3000/api/auth/callback');
    });

    it('should handle custom port in development', () => {
      mockDependencies.env.NODE_ENV = 'development';
      authService.initialize(mockDependencies);
      
      const mockRequest = new Request('http://localhost:8080/test');
      const redirectUri = authService.getRedirectUri(mockRequest);
      
      expect(redirectUri).toBe('http://localhost:8080/api/auth/callback');
    });
  });

  describe('generateJWT', () => {
    it('should generate valid JWT token', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
        verified_email: true,
      };

      const token = await authService.generateJWT(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in JWT payload', async () => {
      const user: AuthUser = {
        id: 'user-456',
        email: 'user@godwear.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        verified_email: true,
      };

      const token = await authService.generateJWT(user);
      
      // Decode JWT payload (base64)
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.name).toBe(user.name);
      expect(payload.picture).toBe(user.picture);
      expect(payload.email_verified).toBe(user.verified_email);
    });

    it('should set appropriate expiration time', async () => {
      const user: AuthUser = {
        id: 'user-789',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const beforeGeneration = Math.floor(Date.now() / 1000);
      const token = await authService.generateJWT(user);
      const afterGeneration = Math.floor(Date.now() / 1000);
      
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      expect(payload.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(payload.iat).toBeLessThanOrEqual(afterGeneration);
      expect(payload.exp).toBeGreaterThan(payload.iat);
      // Should expire in about 24 hours (86400 seconds)
      expect(payload.exp - payload.iat).toBeCloseTo(86400, -2);
    });
  });

  describe('verifyJWT', () => {
    it('should verify valid JWT token', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
        verified_email: true,
      };

      const token = await authService.generateJWT(user);
      const result = await authService.verifyJWT(token);
      
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe(user.id);
      expect(result.payload?.email).toBe(user.email);
    });

    it('should reject invalid JWT token', async () => {
      const invalidToken = 'invalid.jwt.token';
      const result = await authService.verifyJWT(invalidToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.payload).toBeUndefined();
    });

    it('should reject expired JWT token', async () => {
      // Create a token that's already expired
      const expiredPayload = {
        sub: 'user-123',
        email: 'test@godwear.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      };

      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(expiredPayload));
      const expiredToken = `${encodedHeader}.${encodedPayload}.fake-signature`;

      const result = await authService.verifyJWT(expiredToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject malformed JWT token', async () => {
      const malformedTokens = [
        'not-a-jwt',
        'only.two.parts',
        'too.many.parts.here.extra',
        '',
        'header.payload.', // Missing signature
      ];

      for (const token of malformedTokens) {
        const result = await authService.verifyJWT(token);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Google OAuth Flow', () => {
    it('should handle successful Google OAuth callback', async () => {
      const mockRequest = new Request('http://localhost:3000/test');
      
      // Mock Google token exchange
      server.use(
        http.post('https://oauth2.googleapis.com/token', () => {
          return HttpResponse.json({
            access_token: 'google-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'google-refresh-token',
          });
        })
      );

      // Mock Google user info
      server.use(
        http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
          return HttpResponse.json({
            id: 'google-123',
            email: 'google@godwear.com',
            name: 'Google User',
            picture: 'https://example.com/avatar.jpg',
            verified_email: true,
          });
        })
      );

      const result = await authService.processOAuthCallback('valid-auth-code', mockRequest);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('google@godwear.com');
      expect(result.user?.name).toBe('Google User');
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
    });

    it('should handle Google OAuth token exchange errors', async () => {
      const mockRequest = new Request('http://localhost:3000/test');
      
      server.use(
        http.post('https://oauth2.googleapis.com/token', () => {
          return HttpResponse.json({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code',
          }, { status: 400 });
        })
      );

      const result = await authService.processOAuthCallback('invalid-code', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid_grant');
    });

    it('should handle Google user info fetch errors', async () => {
      const mockRequest = new Request('http://localhost:3000/test');
      
      // Mock successful token exchange
      server.use(
        http.post('https://oauth2.googleapis.com/token', () => {
          return HttpResponse.json({
            access_token: 'google-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
          });
        })
      );

      // Mock failed user info fetch
      server.use(
        http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
          return HttpResponse.json({
            error: 'invalid_token',
          }, { status: 401 });
        })
      );

      const result = await authService.processOAuthCallback('valid-code', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch user info');
    });
  });



  describe('Session Management', () => {
    it('should create session for authenticated user', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const sessionId = await authService.createSession(user);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(10);
    });

    it('should store session in KV store', async () => {
      const user: AuthUser = {
        id: 'user-456',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const sessionId = await authService.createSession(user);
      
      // Verify session was stored
      const storedSession = await mockDependencies.env.SESSION_STORE.get(sessionId);
      expect(storedSession).toBeDefined();
      
      const sessionData = JSON.parse(storedSession!);
      expect(sessionData.userId).toBe(user.id);
      expect(sessionData.email).toBe(user.email);
    });

    it('should validate existing session', async () => {
      const user: AuthUser = {
        id: 'user-789',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const sessionId = await authService.createSession(user);
      const isValid = await authService.validateSession('valid-jwt-token', sessionId);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid session', async () => {
      const isValid = await authService.validateSession('invalid-jwt-token', 'invalid-session-id');
      expect(isValid).toBe(false);
    });

    it('should reject expired session', async () => {
      // Create an expired session manually
      const expiredSessionData = {
        userId: 'user-123',
        email: 'test@godwear.com',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      await mockDependencies.env.SESSION_STORE.put(
        'expired-session',
        JSON.stringify(expiredSessionData)
      );

      const isValid = await authService.validateSession('expired-session');
      expect(isValid).toBe(false);
    });

    it('should destroy session', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const sessionId = await authService.createSession(user);
      await authService.destroySession(sessionId);
      
      const storedSession = await mockDependencies.env.SESSION_STORE.get(sessionId);
      expect(storedSession).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when properly initialized', async () => {
      const health = await authService.getHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('auth-service');
      expect(health.timestamp).toBeDefined();
    });

    it('should return unhealthy status when not initialized', async () => {
      const uninitializedService = new AuthService();
      const health = await uninitializedService.getHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockRequest = new Request('http://localhost:3000/test');
      
      server.use(
        http.post('https://oauth2.googleapis.com/token', () => {
          return HttpResponse.error();
        })
      );

      const result = await authService.processOAuthCallback('valid-code', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle JSON parsing errors', async () => {
      const mockRequest = new Request('http://localhost:3000/test');
      
      server.use(
        http.post('https://oauth2.googleapis.com/token', () => {
          return new Response('Invalid JSON', { status: 200 });
        })
      );

      const result = await authService.processOAuthCallback('valid-code', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing environment variables', () => {
      const incompleteEnv = { ...mockDependencies.env };
      delete incompleteEnv.JWT_SECRET;
      
      const incompleteDependencies = {
        ...mockDependencies,
        env: incompleteEnv,
      };

      expect(() => {
        authService.initialize(incompleteDependencies);
      }).toThrow();
    });
  });

  describe('Security', () => {
    it('should use secure JWT signing', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const token1 = await authService.generateJWT(user);
      const token2 = await authService.generateJWT(user);
      
      // Tokens should be different due to unique JWT IDs
      expect(token1).not.toBe(token2);
      
      // But both should be valid
      const result1 = await authService.verifyJWT(token1);
      const result2 = await authService.verifyJWT(token2);
      
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should not accept tokens with tampered payload', async () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@godwear.com',
        name: 'Test User',
      };

      const validToken = await authService.generateJWT(user);
      const parts = validToken.split('.');
      
      // Tamper with the payload
      const tamperedPayload = btoa(JSON.stringify({
        sub: 'admin-123', // Changed user ID
        email: 'admin@godwear.com',
        name: 'Admin User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      }));
      
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      const result = await authService.verifyJWT(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
