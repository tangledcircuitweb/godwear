/**
 * Live test setup utilities
 */

export function createMockEnv() {
  return {
    // Mock environment variables for testing
    DB: {} as D1Database,
    GODWEAR_KV: {} as KVNamespace,
    SESSION_STORE: {} as KVNamespace,
    CACHE: {} as KVNamespace,
  };
}
