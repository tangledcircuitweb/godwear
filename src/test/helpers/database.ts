import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

let worker: UnstableDevWorker | null = null;

/**
 * Get or create a Wrangler dev worker for database access
 */
export async function getTestDatabase(): Promise<D1Database> {
  if (!worker) {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      local: true,
      persist: false, // Don't persist data between test runs
    });
  }

  // Access the D1 database through the worker's environment
  return (worker as any).env.DB;
}

/**
 * Clean up test database worker
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (worker) {
    await worker.stop();
    worker = null;
  }
}

/**
 * Clear test data from database tables
 */
export async function clearTestData(db: D1Database): Promise<void> {
  try {
    // Clear test data (but keep schema)
    await db.prepare('DELETE FROM users WHERE email LIKE ?').bind('%test%').run();
    await db.prepare('DELETE FROM sessions WHERE user_id LIKE ?').bind('%test%').run();
    await db.prepare('DELETE FROM audit_logs WHERE user_id LIKE ?').bind('%test%').run();
  } catch (error) {
    console.warn('Warning: Could not clean database:', error);
  }
}

/**
 * Create a real database service that uses the actual D1 database
 */
export async function createRealDatabaseService() {
  const db = await getTestDatabase();
  
  return {
    async query<T = unknown>(sql: string, params?: any[]): Promise<{results: T[], success: boolean, meta: any}> {
      const stmt = db.prepare(sql);
      if (params) {
        params.forEach((param, index) => stmt.bind(param));
      }
      const result = await stmt.all();
      return {
        results: result.results as T[],
        success: result.success,
        meta: result.meta
      };
    },

    async queryOne<T = unknown>(sql: string, params?: any[]): Promise<{result: T | null, success: boolean, meta: any}> {
      const stmt = db.prepare(sql);
      if (params) {
        params.forEach((param, index) => stmt.bind(param));
      }
      const result = await stmt.first();
      return {
        result: result as T | null,
        success: true,
        meta: { duration: 1, rows_read: result ? 1 : 0, rows_written: 0 }
      };
    },

    async execute(sql: string, params?: any[]): Promise<D1Result> {
      const stmt = db.prepare(sql);
      if (params) {
        params.forEach((param, index) => stmt.bind(param));
      }
      return await stmt.run();
    }
  };
}
