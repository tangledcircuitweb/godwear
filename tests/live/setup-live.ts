import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import type { TestEnv, TestUser, TestJWTPayload } from './types';
import { TEST_ENV, TEST_USERS } from './constants';
import { createMockD1, createMockR2 } from './mocks/cloudflare';
import { generateTestJWT, createTestUser } from './helpers/auth';
import { execSync } from 'child_process';

// Setup MSW server for API mocking (but not KV)
export const server = setupServer(...handlers);

// Live KV helper functions
class LiveKVNamespace {
  constructor(private namespaceId: string, private binding: string, private useRemote: boolean = false) {}

  async get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      const cmd = `wrangler kv key get "${key}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      const result = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
      
      // Handle "Value not found" response
      if (!result || result.trim() === '' || result.includes('Value not found')) {
        return null;
      }

      if (options?.type === 'json') {
        return JSON.parse(result);
      }
      return result;
    } catch (error) {
      // Key not found or other error
      return null;
    }
  }

  async put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number; metadata?: any }): Promise<void> {
    try {
      // For JSON data, we need to properly escape it for shell
      const escapedValue = typeof value === 'string' ? value.replace(/"/g, '\\"') : value;
      const remoteFlag = this.useRemote ? '--remote' : '';
      let cmd = `wrangler kv key put "${key}" "${escapedValue}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      
      if (options?.expirationTtl) {
        cmd += ` --ttl=${options.expirationTtl}`;
      }
      
      if (options?.metadata) {
        cmd += ` --metadata='${JSON.stringify(options.metadata)}'`;
      }

      execSync(cmd, { cwd: process.cwd() });
    } catch (error) {
      throw new Error(`Failed to put KV key ${key}: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      const cmd = `wrangler kv key delete "${key}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      execSync(cmd, { cwd: process.cwd() });
    } catch (error) {
      // Key might not exist, that's ok
    }
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string; metadata?: any }> }> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      let cmd = `wrangler kv key list --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      
      if (options?.prefix) {
        cmd += ` --prefix="${options.prefix}"`;
      }
      
      if (options?.limit) {
        cmd += ` --limit=${options.limit}`;
      }

      const result = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
      const keys = JSON.parse(result);
      
      // Wrangler returns an array directly, but we want to match KV interface
      return { keys: Array.isArray(keys) ? keys : [] };
    } catch (error) {
      return { keys: [] };
    }
  }
}

// Create live KV namespace
function createLiveKV(binding: string, useRemote: boolean = false): LiveKVNamespace {
  // Use the actual KV namespace ID from wrangler.jsonc
  const namespaceId = '3337a52b4f64450ea27fd5065d8f7da2';
  return new LiveKVNamespace(namespaceId, binding, useRemote);
}

// Start server before all tests
beforeAll(async () => {
  server.listen({ 
    onUnhandledRequest: 'warn'
  });
  
  console.log('🧪 Live Test setup: MSW server started');
  console.log('🔴 Live Test setup: Using REAL Cloudflare KV');
  
  // Clean up any existing test data in KV
  const kv = createLiveKV('GODWEAR_KV');
  const existingKeys = await kv.list({ prefix: 'test_' });
  
  for (const key of existingKeys.keys) {
    await kv.delete(key.name);
  }
  
  console.log(`🧹 Cleaned up ${existingKeys.keys.length} test keys from KV`);
});

// Reset handlers after each test and clean up test data
afterEach(async () => {
  server.resetHandlers();
  vi.clearAllMocks();
  
  // Clean up test data from KV after each test
  const kv = createLiveKV('GODWEAR_KV');
  const testKeys = await kv.list({ prefix: 'test_' });
  
  for (const key of testKeys.keys) {
    await kv.delete(key.name);
  }
});

// Clean up after all tests
afterAll(async () => {
  server.close();
  
  // Final cleanup of any remaining test data
  const kv = createLiveKV('GODWEAR_KV');
  const remainingKeys = await kv.list({ prefix: 'test_' });
  
  for (const key of remainingKeys.keys) {
    await kv.delete(key.name);
  }
  
  console.log('🧪 Live Test setup: MSW server closed');
  console.log('🧹 Final cleanup: Removed all test data from KV');
});

// Live environment factory - uses real KV but mock D1/R2 for now
function createLiveEnv(): TestEnv {
  return {
    // REAL KV Namespaces
    CACHE: createLiveKV('CACHE'),
    SESSION_STORE: createLiveKV('SESSION_STORE'),
    USER_SESSIONS: createLiveKV('USER_SESSIONS'),
    GODWEAR_KV: createLiveKV('GODWEAR_KV'),
    
    // Mock D1 Database (can be made live later)
    DB: createMockD1(),
    
    // Mock R2 Buckets (can be made live later)
    ASSETS: createMockR2('ASSETS'),
    USER_UPLOADS: createMockR2('USER_UPLOADS'),
    
    // Environment variables
    ENVIRONMENT: 'test',
    JWT_SECRET: TEST_ENV.JWT_SECRET,
    GOOGLE_CLIENT_ID: TEST_ENV.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: TEST_ENV.GOOGLE_CLIENT_SECRET,
    BASE_URL: 'http://localhost:8787', // Assuming wrangler dev runs on 8787
    OAUTH_REDIRECT_URI: 'http://localhost:8787/api/auth/callback',
  };
}

// Global test utilities
declare global {
  var createLiveEnv: () => TestEnv;
  var createTestUser: (overrides?: Partial<TestUser>) => TestUser;
  var createTestJWT: (payload: TestJWTPayload) => string;
  var createAuthenticatedRequest: (path: string, options?: RequestInit) => Request;
  var testKV: LiveKVNamespace; // Direct access to KV for testing
}

// Assign global utilities
globalThis.createLiveEnv = createLiveEnv;
globalThis.createTestUser = createTestUser;
globalThis.createTestJWT = generateTestJWT;
globalThis.testKV = createLiveKV('GODWEAR_KV');
globalThis.createAuthenticatedRequest = (path: string, options: RequestInit = {}): Request => {
  const token = generateTestJWT({ 
    userId: TEST_USERS.REGULAR_USER.id, 
    email: TEST_USERS.REGULAR_USER.email,
    role: TEST_USERS.REGULAR_USER.role 
  });
  
  return new Request(`http://localhost:8787${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Console setup for live test environment
console.log('🔴 LIVE TEST ENVIRONMENT INITIALIZED');
console.log('📍 Base URL: http://localhost:8787');
console.log('🗄️  Using LOCAL Cloudflare KV namespace: 3337a52b4f64450ea27fd5065d8f7da2');
console.log('⚠️  Test data will be written to and cleaned from local KV!');
console.log('💡 Use createLiveKV(binding, true) for remote KV testing');

// Export for use in tests
export { createLiveEnv, createLiveKV };
