import { execSync } from 'child_process';

/**
 * Utilities for managing test resources with proper cleanup
 */

/**
 * Generate a unique test resource name
 */
export function generateTestResourceName(prefix: string, type: 'bucket' | 'kv' | 'db' = 'bucket'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const workerId = process.env.VITEST_WORKER_ID || 'main';
  
  return `${prefix}-test-${workerId}-${timestamp}-${random}`;
}

/**
 * Create an R2 bucket for testing with automatic cleanup tracking
 */
export async function createTestR2Bucket(baseName: string = 'godwear-assets'): Promise<string> {
  const bucketName = generateTestResourceName(baseName, 'bucket');
  
  try {
    console.log(`🪣 Creating test R2 bucket: ${bucketName}`);
    execSync(`wrangler r2 bucket create ${bucketName}`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Track this bucket for cleanup
    trackTestResource('r2-bucket', bucketName);
    
    console.log(`✅ Created test R2 bucket: ${bucketName}`);
    return bucketName;
  } catch (error) {
    console.error(`Failed to create test R2 bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * Delete an R2 bucket used in testing
 */
export async function deleteTestR2Bucket(bucketName: string): Promise<void> {
  try {
    console.log(`🗑️  Deleting test R2 bucket: ${bucketName}`);
    execSync(`wrangler r2 bucket delete ${bucketName}`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Remove from tracking
    untrackTestResource('r2-bucket', bucketName);
    
    console.log(`✅ Deleted test R2 bucket: ${bucketName}`);
  } catch (error) {
    console.warn(`Failed to delete test R2 bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * Create a KV namespace for testing with automatic cleanup tracking
 */
export async function createTestKVNamespace(baseName: string): Promise<{ id: string; name: string }> {
  const namespaceName = generateTestResourceName(baseName.toUpperCase(), 'kv');
  
  try {
    console.log(`🗄️  Creating test KV namespace: ${namespaceName}`);
    const output = execSync(`wrangler kv namespace create ${namespaceName}`, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Parse the namespace ID from the output
    const idMatch = output.match(/id = "([^"]+)"/);
    if (!idMatch) {
      throw new Error('Failed to parse namespace ID from wrangler output');
    }
    
    const namespaceId = idMatch[1];
    
    // Track this namespace for cleanup
    trackTestResource('kv-namespace', `${namespaceName}:${namespaceId}`);
    
    console.log(`✅ Created test KV namespace: ${namespaceName} (${namespaceId})`);
    return { id: namespaceId, name: namespaceName };
  } catch (error) {
    console.error(`Failed to create test KV namespace ${namespaceName}:`, error);
    throw error;
  }
}

/**
 * Delete a KV namespace used in testing
 */
export async function deleteTestKVNamespace(namespaceId: string, namespaceName?: string): Promise<void> {
  try {
    console.log(`🗑️  Deleting test KV namespace: ${namespaceName || namespaceId}`);
    execSync(`wrangler kv namespace delete --namespace-id ${namespaceId}`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Remove from tracking
    untrackTestResource('kv-namespace', `${namespaceName}:${namespaceId}`);
    
    console.log(`✅ Deleted test KV namespace: ${namespaceName || namespaceId}`);
  } catch (error) {
    console.warn(`Failed to delete test KV namespace ${namespaceId}:`, error);
    throw error;
  }
}

/**
 * Create a D1 database for testing with automatic cleanup tracking
 */
export async function createTestD1Database(baseName: string = 'godwear'): Promise<{ id: string; name: string }> {
  const databaseName = generateTestResourceName(baseName, 'db');
  
  try {
    console.log(`🗃️  Creating test D1 database: ${databaseName}`);
    const output = execSync(`wrangler d1 create ${databaseName}`, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Parse the database ID from the output
    const idMatch = output.match(/database_id = "([^"]+)"/);
    if (!idMatch) {
      throw new Error('Failed to parse database ID from wrangler output');
    }
    
    const databaseId = idMatch[1];
    
    // Track this database for cleanup
    trackTestResource('d1-database', `${databaseName}:${databaseId}`);
    
    console.log(`✅ Created test D1 database: ${databaseName} (${databaseId})`);
    return { id: databaseId, name: databaseName };
  } catch (error) {
    console.error(`Failed to create test D1 database ${databaseName}:`, error);
    throw error;
  }
}

/**
 * Delete a D1 database used in testing
 */
export async function deleteTestD1Database(databaseName: string): Promise<void> {
  try {
    console.log(`🗑️  Deleting test D1 database: ${databaseName}`);
    execSync(`wrangler d1 delete ${databaseName}`, { 
      stdio: 'pipe',
      timeout: 30000,
      input: 'y\n' // Auto-confirm deletion
    });
    
    // Remove from tracking
    untrackTestResource('d1-database', databaseName);
    
    console.log(`✅ Deleted test D1 database: ${databaseName}`);
  } catch (error) {
    console.warn(`Failed to delete test D1 database ${databaseName}:`, error);
    throw error;
  }
}

/**
 * Ensure an R2 bucket exists, creating it if necessary
 */
export async function ensureTestR2BucketExists(bucketName: string): Promise<void> {
  try {
    // Try to list objects in the bucket (this will fail if bucket doesn't exist)
    execSync(`wrangler r2 object get ${bucketName}/non-existent-key`, { 
      stdio: 'pipe',
      timeout: 10000 
    });
  } catch (error) {
    // Bucket likely doesn't exist, create it
    console.log(`🪣 Bucket ${bucketName} doesn't exist, creating it...`);
    await createTestR2Bucket(bucketName.replace(/-test-.*$/, ''));
  }
}

// Resource tracking for cleanup
const testResources = new Map<string, Set<string>>();

function trackTestResource(type: string, identifier: string): void {
  if (!testResources.has(type)) {
    testResources.set(type, new Set());
  }
  testResources.get(type)!.add(identifier);
}

function untrackTestResource(type: string, identifier: string): void {
  const resources = testResources.get(type);
  if (resources) {
    resources.delete(identifier);
  }
}

/**
 * Get all tracked test resources for cleanup
 */
export function getTrackedTestResources(): Map<string, Set<string>> {
  return new Map(testResources);
}

/**
 * Clean up all tracked test resources
 */
export async function cleanupAllTrackedResources(): Promise<void> {
  console.log('🧹 Cleaning up all tracked test resources...');
  
  const resources = getTrackedTestResources();
  
  // Clean up R2 buckets
  const r2Buckets = resources.get('r2-bucket');
  if (r2Buckets && r2Buckets.size > 0) {
    console.log(`Cleaning up ${r2Buckets.size} tracked R2 buckets...`);
    for (const bucketName of r2Buckets) {
      try {
        await deleteTestR2Bucket(bucketName);
      } catch (error) {
        console.warn(`Failed to cleanup tracked R2 bucket ${bucketName}:`, error);
      }
    }
  }
  
  // Clean up KV namespaces
  const kvNamespaces = resources.get('kv-namespace');
  if (kvNamespaces && kvNamespaces.size > 0) {
    console.log(`Cleaning up ${kvNamespaces.size} tracked KV namespaces...`);
    for (const namespaceInfo of kvNamespaces) {
      try {
        const [name, id] = namespaceInfo.split(':');
        await deleteTestKVNamespace(id, name);
      } catch (error) {
        console.warn(`Failed to cleanup tracked KV namespace ${namespaceInfo}:`, error);
      }
    }
  }
  
  // Clean up D1 databases
  const d1Databases = resources.get('d1-database');
  if (d1Databases && d1Databases.size > 0) {
    console.log(`Cleaning up ${d1Databases.size} tracked D1 databases...`);
    for (const databaseInfo of d1Databases) {
      try {
        const databaseName = databaseInfo.split(':')[0];
        await deleteTestD1Database(databaseName);
      } catch (error) {
        console.warn(`Failed to cleanup tracked D1 database ${databaseInfo}:`, error);
      }
    }
  }
  
  console.log('✅ Finished cleaning up tracked test resources');
}
