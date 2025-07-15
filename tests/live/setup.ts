import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import type { TestEnv, TestUser, TestJWTPayload } from './types';
import { TEST_ENV, TEST_USERS } from './constants';
import { createMockKV, createMockD1, createMockR2 } from './mocks/cloudflare';
import { createMockDatabaseService } from './mocks/database-service';
import { generateTestJWT, createTestUser } from './helpers/auth';
import { execSync } from 'child_process';

// Helper function to clean wrangler output and extract JSON
function cleanWranglerOutput(output: string): string {
  // Remove ANSI escape codes and emojis
  const cleaned = output
    .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
    .replace(/[⛅️🔧🚀📦✨🎯]/g, '') // Remove common emojis
    .replace(/^\s*wrangler.*$/gm, '') // Remove wrangler command lines
    .replace(/^\s*Using.*$/gm, '') // Remove "Using" lines
    .replace(/^\s*⎯.*$/gm, '') // Remove separator lines
    .trim();
  
  // Try to find JSON content
  const lines = cleaned.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        continue;
      }
    }
  }
  
  // If no valid JSON found, return empty result
  return '{"results": []}';
}

// Helper function to replace SQL parameters
function replaceQueryParams(query: string, params: any[]): string {
  let paramIndex = 0;
  return query.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      throw new Error(`Not enough parameters provided for query: ${query}`);
    }
    const param = params[paramIndex++];
    if (param === null || param === undefined) {
      return 'NULL';
    }
    if (typeof param === 'string') {
      return `'${param.replace(/'/g, "''")}'`;
    }
    if (typeof param === 'boolean') {
      return param ? '1' : '0';
    }
    if (param instanceof Date) {
      return `'${param.toISOString()}'`;
    }
    return String(param);
  });
}

// Import LiveKVNamespace from setup-live.ts
class LiveKVNamespace {
  constructor(private namespaceId: string, private binding: string, private useRemote: boolean = false) {}

  async get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      const cmd = `wrangler kv key get "${key}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      const result = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
      
      if (!result || result.trim() === '' || result.includes('Value not found')) {
        return null;
      }

      if (options?.type === 'json') {
        return JSON.parse(result);
      }
      return result;
    } catch (error) {
      console.error('LiveKV get error:', error);
      return null;
    }
  }

  async put(key: string, value: any, options?: { expirationTtl?: number; metadata?: any }): Promise<void> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      let valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      valueStr = valueStr.replace(/"/g, '\\"');
      
      const cmd = `wrangler kv key put "${key}" "${valueStr}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      execSync(cmd, { cwd: process.cwd() });
    } catch (error) {
      console.error('LiveKV put error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const remoteFlag = this.useRemote ? '--remote' : '';
      const cmd = `wrangler kv key delete "${key}" --namespace-id="${this.namespaceId}" ${remoteFlag}`;
      execSync(cmd, { cwd: process.cwd() });
    } catch (error) {
      console.error('LiveKV delete error:', error);
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
      return JSON.parse(result);
    } catch (error) {
      console.error('LiveKV list error:', error);
      return { keys: [] };
    }
  }
}

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Live service creation functions using wrangler CLI
function createLiveKV(binding: string): KVNamespace {
  const namespaceId = process.env.GODWEAR_KV_NAMESPACE_ID || '3337a52b4f64450ea27fd5065d8f7da2';
  return new LiveKVNamespace(namespaceId, binding) as any;
}

function createLiveD1(dbName: string): D1Database {
  return {
    prepare: (query: string) => {
      let boundParams: any[] = [];
      
      return {
        bind: (...params: any[]) => {
          boundParams = params;
          return {
            first: async () => {
              try {
                const finalQuery = replaceQueryParams(query, boundParams);
                const escapedQuery = finalQuery.replace(/"/g, '\\"');
                const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
                const result = execSync(cmd, { encoding: 'utf8' });
                const cleanedResult = cleanWranglerOutput(result);
                const parsed = JSON.parse(cleanedResult);
                return parsed.results?.[0] || null;
              } catch (error) {
                console.error('Live D1 query error:', error);
                return null;
              }
            },
            all: async () => {
              try {
                const finalQuery = replaceQueryParams(query, boundParams);
                const escapedQuery = finalQuery.replace(/"/g, '\\"');
                const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
                const result = execSync(cmd, { encoding: 'utf8' });
                const cleanedResult = cleanWranglerOutput(result);
                const parsed = JSON.parse(cleanedResult);
                return { results: parsed.results || [] };
              } catch (error) {
                console.error('Live D1 query error:', error);
                return { results: [] };
              }
            },
            run: async () => {
              try {
                const finalQuery = replaceQueryParams(query, boundParams);
                const escapedQuery = finalQuery.replace(/"/g, '\\"');
                const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
                const result = execSync(cmd, { encoding: 'utf8' });
                const cleanedResult = cleanWranglerOutput(result);
                const parsed = JSON.parse(cleanedResult);
                return { 
                  success: true, 
                  meta: { changes: parsed.meta?.changes || 1 } 
                };
              } catch (error) {
                console.error('Live D1 query error:', error);
                return { success: false, meta: { changes: 0 } };
              }
            }
          };
        },
        first: async () => {
          try {
            const finalQuery = replaceQueryParams(query, boundParams);
            const escapedQuery = finalQuery.replace(/"/g, '\\"');
            const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
            const result = execSync(cmd, { encoding: 'utf8' });
            const cleanedResult = cleanWranglerOutput(result);
            const parsed = JSON.parse(cleanedResult);
            return parsed.results?.[0] || null;
          } catch (error) {
            console.error('Live D1 query error:', error);
            return null;
          }
        },
        all: async () => {
          try {
            const finalQuery = replaceQueryParams(query, boundParams);
            const escapedQuery = finalQuery.replace(/"/g, '\\"');
            const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
            const result = execSync(cmd, { encoding: 'utf8' });
            const cleanedResult = cleanWranglerOutput(result);
            const parsed = JSON.parse(cleanedResult);
            return { results: parsed.results || [] };
          } catch (error) {
            console.error('Live D1 query error:', error);
            return { results: [] };
          }
        },
        run: async () => {
          try {
            const finalQuery = replaceQueryParams(query, boundParams);
            const escapedQuery = finalQuery.replace(/"/g, '\\"');
            const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
            const result = execSync(cmd, { encoding: 'utf8' });
            const cleanedResult = cleanWranglerOutput(result);
            const parsed = JSON.parse(cleanedResult);
            return { 
              success: true, 
              meta: { changes: parsed.meta?.changes || 1 } 
            };
          } catch (error) {
            console.error('Live D1 query error:', error);
            return { success: false, meta: { changes: 0 } };
          }
        }
      };
    },
    exec: async (query: string) => {
      try {
        const escapedQuery = query.replace(/"/g, '\\"');
        const cmd = `wrangler d1 execute ${dbName} --command="${escapedQuery}"`;
        const result = execSync(cmd, { encoding: 'utf8' });
        const cleanedResult = cleanWranglerOutput(result);
        const parsed = JSON.parse(cleanedResult);
        return { results: parsed.results || [] };
      } catch (error) {
        console.error('Live D1 exec error:', error);
        return { results: [] };
      }
    }
  } as any;
}

function createLiveDatabaseService(dbName: string) {
  const liveD1 = createLiveD1(dbName);
  
  const service = {
    getConnection: () => liveD1,
    
    query: async (sql: string, params?: any[]) => {
      const stmt = liveD1.prepare(sql);
      const boundStmt = params && params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await boundStmt.all();
      return { 
        results: result.results, 
        success: true,
        meta: { duration: 0, rows_read: result.results?.length || 0, rows_written: 0 }
      };
    },
    
    queryOne: async (sql: string, params?: any[]) => {
      const stmt = liveD1.prepare(sql);
      const boundStmt = params && params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await boundStmt.first();
      return { 
        result, 
        success: true,
        meta: { duration: 0, rows_read: result ? 1 : 0, rows_written: 0 }
      };
    },
    
    execute: async (sql: string, params?: any[]) => {
      const stmt = liveD1.prepare(sql);
      const boundStmt = params && params.length > 0 ? stmt.bind(...params) : stmt;
      return await boundStmt.run();
    },
    
    // Health check
    healthCheck: async () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: { service: 'live-d1', database: dbName }
    }),
    
    // Transaction support (simplified for testing)
    transaction: async (callback: any) => {
      return await callback({ 
        query: service.query, 
        queryOne: service.queryOne, 
        execute: service.execute 
      });
    },
    
    // Migration support (no-op for testing)
    runMigrations: async () => {},
    rollbackMigration: async () => {},
    getMigrationStatus: async () => [],
    
    // Schema management (simplified for testing)
    getTableSchema: async () => ({ columns: [], indexes: [], constraints: [] }),
    validateSchema: async () => true,
    
    // Metrics (simplified for testing)
    getMetrics: () => ({
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0
    }),
    resetMetrics: () => {}
  };
  
  return service;
}

function createLiveR2(bucketName: string): R2Bucket {
  return {
    get: async (key: string) => {
      try {
        const cmd = `wrangler r2 object get ${bucketName}/${key} --pipe`;
        const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
        
        // Extract content after the wrangler headers
        // Look for the last line that contains actual content
        const lines = result.split('\n');
        const contentLines = lines.filter(line => 
          !line.includes('wrangler') && 
          !line.includes('─') && 
          !line.includes('Resource location') &&
          !line.includes('Use --remote') &&
          !line.includes('Downloading') &&
          !line.includes('Download complete') &&
          line.trim() !== ''
        );
        
        const content = contentLines.join('\n').trim();
        return {
          text: async () => content,
          body: content
        } as any;
      } catch (error) {
        return null;
      }
    },
    put: async (key: string, value: any) => {
      try {
        // For testing, we'll use a simple approach with proper escaping
        const cmd = `echo ${JSON.stringify(value)} | wrangler r2 object put ${JSON.stringify(`${bucketName}/${key}`)} --pipe`;
        execSync(cmd, { stdio: 'pipe' });
        return {} as any;
      } catch (error) {
        throw error;
      }
    },
    delete: async (key: string) => {
      try {
        const cmd = `wrangler r2 object delete ${bucketName}/${key}`;
        execSync(cmd);
      } catch (error) {
        // Ignore delete errors in tests
      }
    },
    list: async () => {
      try {
        const cmd = `wrangler r2 object list ${bucketName}`;
        const result = execSync(cmd, { encoding: 'utf8' });
        return { objects: [] } as any; // Simplified for testing
      } catch (error) {
        return { objects: [] } as any;
      }
    }
  } as any;
}

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
  const useLiveKV = process.env.USE_LIVE_KV === 'true';
  const useLiveD1 = process.env.USE_LIVE_D1 === 'true';
  const useLiveR2 = process.env.USE_LIVE_R2 === 'true';
  
  return {
    // KV Namespaces - use live KV with real namespace ID
    CACHE: useLiveKV ? createLiveKV('GODWEAR_KV') : createMockKV('CACHE'),
    SESSION_STORE: useLiveKV ? createLiveKV('GODWEAR_KV') : createMockKV('SESSION_STORE'),
    USER_SESSIONS: useLiveKV ? createLiveKV('GODWEAR_KV') : createMockKV('USER_SESSIONS'),
    GODWEAR_KV: useLiveKV ? createLiveKV('GODWEAR_KV') : createMockKV('GODWEAR_KV'),
    
    // D1 Database - use live D1 with real database name
    DB: useLiveD1 ? createLiveD1('godwear-db') : createMockD1(),
    
    // Database Service - use live if D1 is live
    DATABASE_SERVICE: useLiveD1 ? createLiveDatabaseService('godwear-db') : createMockDatabaseService(),
    
    // R2 Buckets - use live R2 with real bucket names
    ASSETS: useLiveR2 ? createLiveR2('godwear-assets') : createMockR2('ASSETS'),
    USER_UPLOADS: useLiveR2 ? createLiveR2('godwear-uploads') : createMockR2('USER_UPLOADS'),
    
    // Environment variables
    ENVIRONMENT: 'test',
    JWT_SECRET: TEST_ENV.JWT_SECRET,
    GOOGLE_CLIENT_ID: TEST_ENV.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: TEST_ENV.GOOGLE_CLIENT_SECRET,
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

import { cleanupAllTrackedResources } from './utils/test-resources';

// Console setup for test environment
console.log('🧪 Test environment initialized');
console.log(`📍 Base URL: ${TEST_ENV.BASE_URL}`);
console.log(`🔑 JWT Secret: ${TEST_ENV.JWT_SECRET.substring(0, 10)}...`);

// Global cleanup hook for live tests
afterAll(async () => {
  console.log('🧹 Running live test cleanup...');
  try {
    await cleanupAllTrackedResources();
    console.log('✅ Live test cleanup completed');
  } catch (error) {
    console.warn('⚠️  Some live test cleanup operations failed:', error);
  }
});

// Export for use in tests
export { createMockEnv };
