import { vi } from 'vitest';
import type { TestUser, TestJWTPayload } from '../types';
import { TEST_ENV, TEST_USERS } from '../constants';

// Simple JWT generation for testing (not cryptographically secure)
export function generateTestJWT(payload: TestJWTPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: payload.iat || now,
    exp: payload.exp || (now + 3600), // 1 hour expiry
  };
  
  // Base64 encode header and payload
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  
  // Create a simple signature for testing
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${TEST_ENV.JWT_SECRET}`);
  
  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  console.log('🔑 Generated test JWT for user:', payload.userId);
  
  return jwt;
}

// Verify test JWT (simplified for testing)
export function verifyTestJWT(token: string): TestJWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('🔑 JWT expired');
      return null;
    }
    
    console.log('🔑 JWT verified for user:', payload.userId);
    return payload;
  } catch (error) {
    console.log('🔑 JWT verification failed:', error);
    return null;
  }
}

// Create test user with optional overrides
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const baseUser = TEST_USERS.REGULAR_USER;
  const timestamp = new Date().toISOString();
  
  const user: TestUser = {
    id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@godwear.com`,
    name: 'Test User',
    role: 'USER',
    provider: 'email',
    emailVerified: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
  
  console.log('👤 Created test user:', { id: user.id, email: user.email, role: user.role });
  
  return user;
}

// Create admin test user
export function createTestAdmin(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    ...TEST_USERS.ADMIN_USER,
    role: 'ADMIN',
    ...overrides,
  });
}

// Create OAuth test user
export function createTestOAuthUser(provider: 'google', overrides: Partial<TestUser> = {}): TestUser {
  const baseUser = TEST_USERS.GOOGLE_USER;
  
  return createTestUser({
    ...baseUser,
    provider,
    providerId: `${provider}-${Date.now()}`,
    ...overrides,
  });
}

// Create unverified test user
export function createTestUnverifiedUser(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    ...TEST_USERS.UNVERIFIED_USER,
    emailVerified: false,
    ...overrides,
  });
}

// Mock authentication middleware
export function mockAuthMiddleware(user?: TestUser) {
  return vi.fn((req: any, res: any, next: any) => {
    if (user) {
      req.user = user;
      req.session = {
        id: `session-${user.id}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      };
    }
    next();
  });
}

// Create authenticated request context
export function createAuthContext(user?: TestUser) {
  const testUser = user || createTestUser();
  const token = generateTestJWT({
    userId: testUser.id,
    email: testUser.email,
    role: testUser.role,
  });
  
  return {
    user: testUser,
    token,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    session: {
      id: `session-${testUser.id}`,
      userId: testUser.id,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };
}

// Mock session storage
export function createMockSession(userId: string) {
  const sessionId = `session-${userId}-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  
  return {
    id: sessionId,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  };
}

// Password hashing mock (for testing)
export const mockPasswordHash = {
  hash: vi.fn(async (password: string) => {
    return `hashed_${password}_${Date.now()}`;
  }),
  
  verify: vi.fn(async (password: string, hash: string) => {
    return hash.includes(password);
  }),
};

// Email verification token generation
export function generateEmailVerificationToken(email: string): string {
  const payload = {
    email,
    type: 'email_verification',
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  };
  
  return btoa(JSON.stringify(payload));
}

// Password reset token generation
export function generatePasswordResetToken(userId: string): string {
  const payload = {
    userId,
    type: 'password_reset',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  
  return btoa(JSON.stringify(payload));
}

// OAuth state generation
export function generateOAuthState(provider: string): string {
  const state = {
    provider,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substr(2, 16),
  };
  
  return btoa(JSON.stringify(state));
}

// Verify OAuth state
export function verifyOAuthState(state: string, expectedProvider: string): boolean {
  try {
    const decoded = JSON.parse(atob(state));
    const now = Date.now();
    
    // Check provider and timestamp (valid for 10 minutes)
    return decoded.provider === expectedProvider && 
           (now - decoded.timestamp) < 600000;
  } catch {
    return false;
  }
}
