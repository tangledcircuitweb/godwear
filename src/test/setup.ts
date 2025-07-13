import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import type { TestEnv, TestUser, TestJWTPayload } from './types';
import { TEST_ENV, TEST_USERS } from './constants';
import { createMockKV, createMockD1, createMockR2 } from './mocks/cloudflare';
import { generateTestJWT, createTestUser } from './helpers/auth';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'warn' // Changed from 'error' to 'warn' for flexibility
  });
  console.log('🧪 Test setup: MSW server started');
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
  console.log('🧪 Test setup: MSW server closed');
});

// Global mock environment factory
function createMockEnv(): TestEnv {
  return {
    // KV Namespaces
    CACHE: createMockKV('CACHE'),
    SESSION_STORE: createMockKV('SESSION_STORE'),
    USER_SESSIONS: createMockKV('USER_SESSIONS'),
    
    // D1 Database
    DB: createMockD1(),
    
    // R2 Buckets
    ASSETS: createMockR2('ASSETS'),
    USER_UPLOADS: createMockR2('USER_UPLOADS'),
    
    // Environment variables
    ENVIRONMENT: 'test',
    JWT_SECRET: TEST_ENV.JWT_SECRET,
    MAILERSEND_API_KEY: TEST_ENV.MAILERSEND_API_KEY,
    GOOGLE_CLIENT_ID: TEST_ENV.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: TEST_ENV.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: TEST_ENV.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: TEST_ENV.GITHUB_CLIENT_SECRET,
    BASE_URL: TEST_ENV.BASE_URL,
    OAUTH_REDIRECT_URI: TEST_ENV.OAUTH_REDIRECT_URI,
  };
}

// Global test utilities - make them available globally
declare global {
  var createMockEnv: () => TestEnv;
  var createTestUser: (overrides?: Partial<TestUser>) => TestUser;
  var createTestJWT: (payload: TestJWTPayload) => string;
  var createAuthenticatedRequest: (path: string, options?: RequestInit) => Request;
}

// Assign global utilities
globalThis.createMockEnv = createMockEnv;
globalThis.createTestUser = createTestUser;
globalThis.createTestJWT = generateTestJWT;
globalThis.createAuthenticatedRequest = (path: string, options: RequestInit = {}): Request => {
  const token = generateTestJWT({ 
    userId: TEST_USERS.REGULAR_USER.id, 
    email: TEST_USERS.REGULAR_USER.email,
    role: TEST_USERS.REGULAR_USER.role 
  });
  
  return new Request(`${TEST_ENV.BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Console setup for test environment
console.log('🧪 Test environment initialized');
console.log(`📍 Base URL: ${TEST_ENV.BASE_URL}`);
console.log(`🔑 JWT Secret: ${TEST_ENV.JWT_SECRET.substring(0, 10)}...`);
console.log(`📧 MailerSend API: ${TEST_ENV.MAILERSEND_API_KEY.substring(0, 10)}...`);

// Export for use in tests
export { createMockEnv };
