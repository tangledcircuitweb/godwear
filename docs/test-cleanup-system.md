# Test Cleanup System Documentation

## Overview

The GodWear Test Cleanup System is a comprehensive solution for managing test resources in live Cloudflare environments. Implemented July 15, 2025, it ensures no test data accumulates in production services and prevents resource conflicts.

## Problem Statement

### Original Issue
```bash
Error executing wrangler_r2_bucket_create: Command failed: wrangler r2 bucket create godwear-assets
```

### Root Cause
- Test resources accumulating from debugging sessions (23 failed → 30 passed tests progression)
- Hardcoded resource names causing conflicts between test runs
- No automatic cleanup of test data in live Cloudflare services
- Cost accumulation from orphaned test resources

## Solution Architecture

### 1. Global Teardown System

**File**: `tests/global-teardown.js`

```javascript
export default async function globalTeardown() {
  console.log('\n🧹 Starting global test cleanup...');
  
  try {
    await Promise.all([
      cleanupTestR2Buckets(),
      cleanupTestKVNamespaces(),
      cleanupTestD1Databases(),
    ]);
    
    console.log('✅ Global test cleanup completed successfully');
  } catch (error) {
    console.warn('⚠️  Some cleanup operations failed:', error);
  }
}
```

**Features:**
- **Automatic execution**: Runs after all tests complete via vitest `globalTeardown`
- **Pattern-based detection**: Identifies test resources vs production resources
- **Multi-service support**: Cleans R2 buckets, KV namespaces, D1 databases
- **Error resilience**: Continues cleanup even if some operations fail
- **Detailed logging**: Reports cleanup progress and results

**Resource Detection Patterns:**

```javascript
// R2 Buckets
const testBucketPatterns = [
  /^godwear-.*-test-/,     // godwear-assets-test-123
  /^test-bucket-/,         // test-bucket-123
  /-test-\d+/,            // any-name-test-123
  /^temp-/,               // temp-bucket
  /^vitest-/,             // vitest-bucket
];

// KV Namespaces
const testKVPatterns = [
  /^TEST_/,               // TEST_SESSION_STORE
  /_TEST$/,               // SESSION_STORE_TEST
  /^test-/,               // test-namespace
  /-test-/,               // namespace-test-123
  /^vitest-/,             // vitest-namespace
];

// D1 Databases
const testDatabasePatterns = [
  /^test-/,               // test-database
  /-test$/,               // database-test
  /-test-/,               // database-test-123
  /^temp-/,               // temp-database
  /^godwear-test/,        // godwear-test-db
];
```

### 2. Test Resource Utilities

**File**: `tests/live/utils/test-resources.ts`

#### Unique Resource Naming
```typescript
export function generateTestResourceName(
  prefix: string, 
  type: 'bucket' | 'kv' | 'db' = 'bucket'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const workerId = process.env.VITEST_WORKER_ID || 'main';
  
  return `${prefix}-test-${workerId}-${timestamp}-${random}`;
}

// Example output: godwear-assets-test-main-1752622315177-abc123def
```

#### Resource Management Functions
```typescript
// R2 Bucket Management
export async function createTestR2Bucket(baseName: string): Promise<string>
export async function deleteTestR2Bucket(bucketName: string): Promise<void>

// KV Namespace Management  
export async function createTestKVNamespace(baseName: string): Promise<{id: string, name: string}>
export async function deleteTestKVNamespace(namespaceId: string, namespaceName?: string): Promise<void>

// D1 Database Management
export async function createTestD1Database(baseName: string): Promise<{id: string, name: string}>
export async function deleteTestD1Database(databaseName: string): Promise<void>
```

#### Resource Tracking System
```typescript
// Track resources for cleanup
const testResources = new Map<string, Set<string>>();

function trackTestResource(type: string, identifier: string): void {
  if (!testResources.has(type)) {
    testResources.set(type, new Set());
  }
  testResources.get(type)!.add(identifier);
}

export async function cleanupAllTrackedResources(): Promise<void> {
  // Cleanup all tracked resources across all types
}
```

### 3. Individual Test Cleanup

**File**: `tests/live/live-kv.test.ts` (Example)

```typescript
describe("Live KV Connectivity Test", () => {
  const testKeys: string[] = [];
  
  beforeEach(async () => {
    // Clear the test keys array for this test
    testKeys.length = 0;
  });

  afterEach(async () => {
    // Clean up all keys used in this test
    console.log(`🧹 Cleaning up ${testKeys.length} test keys from KV...`);
    for (const key of testKeys) {
      try {
        await globalThis.testKV.delete(key);
        console.log(`  ✅ Deleted KV key: ${key}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to delete KV key ${key}:`, error);
      }
    }
  });

  // Helper function to track keys for cleanup
  const trackKey = (key: string) => {
    testKeys.push(key);
    return key;
  };

  it("should handle test data properly", async () => {
    const testKey = trackKey(`test_connectivity_${Date.now()}`);
    // Test implementation...
  });
});
```

### 4. Manual Cleanup Script

**File**: `scripts/cleanup-test-resources.js`

```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';

async function main() {
  console.log('🧹 Manual test resource cleanup started...\n');
  
  try {
    const { default: globalTeardown } = await import('../tests/global-teardown.js');
    await globalTeardown();
    
    console.log('\n✅ Manual cleanup completed successfully');
  } catch (error) {
    console.error('\n❌ Manual cleanup failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

**Usage:**
```bash
npm run cleanup-tests
```

## Configuration Integration

### Vitest Configuration Updates

**vitest.config.ts** (Mock Testing):
```typescript
export default defineConfig({
  test: {
    // ... other config
    globalTeardown: ["./tests/global-teardown.js"],
  },
});
```

**vitest.live.config.ts** (Live Testing):
```typescript
export default defineConfig({
  test: {
    // ... other config
    testTimeout: 60000,        // 60 seconds for R2 operations
    hookTimeout: 45000,        // 45 seconds for setup/teardown
    globalTeardown: ["./tests/global-teardown.js"],
  },
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "test:live": "vitest --config vitest.live.config.ts",
    "test:live:run": "vitest run --config vitest.live.config.ts", 
    "test:live:kv": "vitest run --config vitest.live.config.ts app/services/auth/auth-service.test.ts",
    "cleanup-tests": "node scripts/cleanup-test-resources.js"
  }
}
```

## Usage Guidelines

### Running Tests with Cleanup

```bash
# Run live tests with automatic cleanup
npm run test:live:run

# Run specific live tests
npm run test:live:kv

# Manual emergency cleanup
npm run cleanup-tests
```

### Test Development Best Practices

#### ✅ **Good Practices**

```typescript
// Use unique resource names with timestamps
const testKey = trackKey(`test_connectivity_${Date.now()}`);
const bucketName = await createTestR2Bucket('godwear-assets');

// Clean up in afterEach hooks
afterEach(async () => {
  for (const key of testKeys) {
    await globalThis.testKV.delete(key);
  }
});

// Use resource tracking
const trackKey = (key: string) => {
  testKeys.push(key);
  return key;
};
```

#### ❌ **Bad Practices**

```typescript
// Hardcoded resource names (will conflict!)
const testKey = "test_connectivity";
const bucketName = "godwear-assets";

// No cleanup (resources will accumulate!)
it("test without cleanup", async () => {
  await globalThis.testKV.put("test-key", "value");
  // No cleanup - BAD!
});

// Shared resources between tests (conflicts!)
const sharedKey = "shared-test-key";
```

## Verification and Monitoring

### Test Results Verification
```bash
✓ tests/live/live-kv.test.ts (4 tests) 25087ms
  ✓ Live KV Connectivity Test (4)
    ✓ should be able to write and read from live KV  4760ms
    ✓ should handle JSON data in live KV  5989ms  
    ✓ should return null for non-existent keys  2231ms
    ✓ should be able to list keys with prefix  9510ms
```

### Cleanup Verification Commands
```bash
# Check R2 buckets
wrangler r2 bucket list

# Check KV namespaces
wrangler kv namespace list

# Check D1 databases  
wrangler d1 list

# Check KV keys in namespace
wrangler kv key list --namespace-id <namespace-id>
```

### Expected Clean State
- **R2 Buckets**: Only production buckets (`godwear-assets`, `godwear-uploads`)
- **KV Namespaces**: All namespaces empty `[]`
- **D1 Database**: Only production tables (`users`, `sessions`, `audit_logs`)

## Troubleshooting

### Common Issues

#### Tests Timing Out
```typescript
// Increase timeouts for R2 operations
export default defineConfig({
  test: {
    testTimeout: 60000,    // 60 seconds
    hookTimeout: 45000,    // 45 seconds
  },
});
```

#### Resources Not Cleaned Up
```bash
# Run manual cleanup
npm run cleanup-tests

# Check for pattern mismatches
# Ensure test resources follow naming patterns
```

#### Permission Errors
```bash
# Ensure wrangler is authenticated
wrangler whoami

# Check token permissions include:
# - workers (write)
# - workers_kv (write) 
# - d1 (write)
```

### Debug Logging
```typescript
// Enable detailed cleanup logging
console.log(`🧹 Cleaning up ${testKeys.length} test keys from KV...`);
console.log(`✅ Deleted KV key: ${key}`);
console.warn(`⚠️  Failed to delete KV key ${key}:`, error);
```

## Benefits Achieved

1. **✅ No Resource Conflicts**: Each test gets unique resource names
2. **✅ Automatic Cleanup**: Resources cleaned up after each test and globally  
3. **✅ Cost Control**: No accumulation of test data in Cloudflare account
4. **✅ Reliable Testing**: Tests can run repeatedly without conflicts
5. **✅ Emergency Recovery**: Manual cleanup script for interrupted tests
6. **✅ Production Safety**: Pattern-based detection protects production resources
7. **✅ Developer Experience**: Clear logging and error handling
8. **✅ CI/CD Ready**: Automated cleanup works in any environment

## Implementation Timeline

- **July 15, 2025**: System implemented and verified
- **Git Commit**: `d87d8fc` - 48 files changed
- **Test Results**: 4/4 live KV tests passing with cleanup
- **Status**: ✅ Production ready

This cleanup system ensures reliable, cost-effective, and conflict-free testing against live Cloudflare infrastructure.
