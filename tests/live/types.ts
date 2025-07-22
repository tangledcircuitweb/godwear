import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import type { Hono } from 'hono';
import type { DatabaseService } from '../../types/database';

// Test environment types
export interface TestEnv {
  CACHE: KVNamespace;
  SESSION_STORE: KVNamespace;
  USER_SESSIONS: KVNamespace;
  GODWEAR_KV: KVNamespace; // Add this for AuthService
  DB: D1Database;
  DATABASE_SERVICE: DatabaseService; // Add this for repository tests
  ASSETS: R2Bucket;
  USER_UPLOADS: R2Bucket;
  ENVIRONMENT: 'test';
  JWT_SECRET: string;
  MAILERSEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BASE_URL: string;
  OAUTH_REDIRECT_URI: string;
}

// Test application type
export type TestApp = Hono<{ Bindings: TestEnv }>;

// Test user data
export interface TestUser {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  verified_email: boolean; // Match UserRecord field name
  last_login_at?: string | null;
  status: "active" | "inactive" | "suspended";
  role: "USER" | "ADMIN" | "MODERATOR";
  provider: "email" | "google" | "github";
  metadata?: string | null;
  created_at: string; // Match UserRecord field name
  updated_at: string; // Match UserRecord field name
}

// Test JWT payload
export interface TestJWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
}

// Test request context
export interface TestRequestContext {
  user?: TestUser;
  session?: {
    id: string;
    userId: string;
    expiresAt: string;
  };
}

// Live response types
export interface LiveResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

// Test data builder types
export interface TestDataBuilderOptions<T> {
  overrides?: Partial<T>;
  count?: number;
}

// Performance test metrics
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  requestsPerSecond?: number;
}

// Test database row types
export interface TestUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  provider: string;
  provider_id: string | null;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export interface TestSessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

// Live API response types
export interface LiveAPIResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

// Test configuration
export interface TestConfig {
  timeout: number;
  retries: number;
  coverage: {
    threshold: number;
  };
  performance: {
    maxResponseTime: number;
    maxMemoryUsage: number;
  };
}

// Custom matcher types for Vitest
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeSuccessResponse(): T;
    toBeErrorResponse(expectedCode?: string): T;
    toBeValidJWT(): T;
    toHaveValidSession(): T;
    toMatchUserSchema(): T;
    toBeWithinPerformanceThreshold(threshold: number): T;
  }
}

// Global live test utilities type
declare global {
  var createLiveEnv: () => TestEnv;
  var createTestUser: (overrides?: Partial<TestUser>) => TestUser;
  var createTestJWT: (payload: TestJWTPayload) => string;
  var createAuthenticatedRequest: (path: string, options?: RequestInit) => Request;
}
