// Test environment constants
export const TEST_ENV = {
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  BASE_URL: 'http://localhost:3000',
  OAUTH_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
} as const;

// Test user data
export const TEST_USERS = {
  REGULAR_USER: {
    id: 'user-123',
    email: 'test@godwear.com',
    name: 'Test User',
    role: 'USER' as const,
    provider: 'email' as const,
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  ADMIN_USER: {
    id: 'admin-123',
    email: 'admin@godwear.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
    provider: 'email' as const,
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  GOOGLE_USER: {
    id: 'google-123',
    email: 'google@godwear.com',
    name: 'Google User',
    role: 'USER' as const,
    provider: 'google' as const,
    providerId: 'google-provider-123',
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  UNVERIFIED_USER: {
    id: 'unverified-123',
    email: 'unverified@godwear.com',
    name: 'Unverified User',
    role: 'USER' as const,
    provider: 'email' as const,
    emailVerified: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
} as const;

// Test API endpoints
export const TEST_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    CALLBACK: '/api/auth/callback',
    GOOGLE: '/api/auth/google',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  USERS: {
    LIST: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
  },
  HEALTH: '/api/health',
} as const;

// Test response codes
export const TEST_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Test error codes
export const TEST_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  OAUTH_ERROR: 'OAUTH_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
} as const;

// Test timeouts and limits
export const TEST_TIMEOUTS = {
  DEFAULT: 5000,
  LONG: 10000,
  VERY_LONG: 30000,
  DATABASE: 3000,
  API_CALL: 5000,
  EMAIL_SEND: 10000,
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME: {
    FAST: 100, // ms
    ACCEPTABLE: 500, // ms
    SLOW: 1000, // ms
  },
  MEMORY_USAGE: {
    LOW: 50 * 1024 * 1024, // 50MB
    MEDIUM: 100 * 1024 * 1024, // 100MB
    HIGH: 200 * 1024 * 1024, // 200MB
  },
  CONCURRENT_REQUESTS: {
    LIGHT: 10,
    MEDIUM: 50,
    HEAVY: 100,
  },
} as const;

// Test database schemas
export const TEST_DB_SCHEMAS = {
  USERS_TABLE: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      provider TEXT NOT NULL DEFAULT 'email',
      provider_id TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  SESSIONS_TABLE: `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `,
} as const;

// Mock external API responses
export const MOCK_API_RESPONSES = {
  GOOGLE_OAUTH: {
    TOKEN_SUCCESS: {
      access_token: 'test-google-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'test-google-refresh-token',
      scope: 'openid email profile',
    },
    USER_INFO: {
      id: 'google-user-123',
      email: 'google@godwear.com',
      name: 'Google User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true,
    },
  },
} as const;

// Test file paths
export const TEST_PATHS = {
  FIXTURES: './tests/live/fixtures',
  MOCKS: './tests/live/mocks',
  COVERAGE: './coverage',
  RESULTS: './test-results',
} as const;
