import { execSync } from 'child_process';

/**
 * Global test cleanup - runs after all tests complete
 * Cleans up any test resources that might be left behind
 */
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

/**
 * Clean up R2 buckets created during testing
 */
async function cleanupTestR2Buckets(): Promise<void> {
  try {
    console.log('🪣 Cleaning up test R2 buckets...');
    
    // List all R2 buckets
    const output = execSync('wrangler r2 bucket list', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse bucket names from output
    const bucketNames = output
      .split('\n')
      .filter(line => line.startsWith('name:'))
      .map(line => line.replace('name:', '').trim())
      .filter(name => isTestBucket(name));
    
    if (bucketNames.length === 0) {
      console.log('  No test R2 buckets found to cleanup');
      return;
    }
    
    console.log(`  Found ${bucketNames.length} test buckets to cleanup:`, bucketNames);
    
    // Delete each test bucket
    for (const bucketName of bucketNames) {
      try {
        console.log(`  Deleting R2 bucket: ${bucketName}`);
        execSync(`wrangler r2 bucket delete ${bucketName}`, { 
          stdio: 'pipe',
          timeout: 30000 
        });
        console.log(`  ✅ Deleted R2 bucket: ${bucketName}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to delete R2 bucket ${bucketName}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup R2 buckets:', error);
  }
}

/**
 * Clean up KV namespaces created during testing
 */
async function cleanupTestKVNamespaces(): Promise<void> {
  try {
    console.log('🗄️  Cleaning up test KV namespaces...');
    
    // List all KV namespaces
    const output = execSync('wrangler kv namespace list', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse namespace info from JSON output
    const namespaces = JSON.parse(output);
    const testNamespaces = namespaces.filter((ns: any) => isTestKVNamespace(ns.title));
    
    if (testNamespaces.length === 0) {
      console.log('  No test KV namespaces found to cleanup');
      return;
    }
    
    console.log(`  Found ${testNamespaces.length} test namespaces to cleanup`);
    
    // Delete each test namespace
    for (const namespace of testNamespaces) {
      try {
        console.log(`  Deleting KV namespace: ${namespace.title} (${namespace.id})`);
        execSync(`wrangler kv namespace delete --namespace-id ${namespace.id}`, { 
          stdio: 'pipe',
          timeout: 30000 
        });
        console.log(`  ✅ Deleted KV namespace: ${namespace.title}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to delete KV namespace ${namespace.title}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup KV namespaces:', error);
  }
}

/**
 * Clean up D1 databases created during testing
 */
async function cleanupTestD1Databases(): Promise<void> {
  try {
    console.log('🗃️  Cleaning up test D1 databases...');
    
    // List all D1 databases
    const output = execSync('wrangler d1 list', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse database info from output
    const lines = output.split('\n').filter(line => line.trim());
    const testDatabases = [];
    
    for (const line of lines) {
      if (line.includes('│') && !line.includes('Name') && !line.includes('─')) {
        const parts = line.split('│').map(part => part.trim()).filter(part => part);
        if (parts.length >= 2) {
          const name = parts[0];
          const id = parts[1];
          if (isTestDatabase(name)) {
            testDatabases.push({ name, id });
          }
        }
      }
    }
    
    if (testDatabases.length === 0) {
      console.log('  No test D1 databases found to cleanup');
      return;
    }
    
    console.log(`  Found ${testDatabases.length} test databases to cleanup`);
    
    // Delete each test database
    for (const database of testDatabases) {
      try {
        console.log(`  Deleting D1 database: ${database.name} (${database.id})`);
        execSync(`wrangler d1 delete ${database.name}`, { 
          stdio: 'pipe',
          timeout: 30000,
          input: 'y\n' // Auto-confirm deletion
        });
        console.log(`  ✅ Deleted D1 database: ${database.name}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to delete D1 database ${database.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup D1 databases:', error);
  }
}

/**
 * Check if an R2 bucket name indicates it's a test bucket
 */
function isTestBucket(bucketName: string): boolean {
  const testPatterns = [
    /^godwear-.*-test-/,           // godwear-assets-test-123
    /^test-bucket-/,               // test-bucket-123
    /-test-\d+/,                   // any-name-test-123
    /^temp-/,                      // temp-bucket
    /^vitest-/,                    // vitest-bucket
  ];
  
  return testPatterns.some(pattern => pattern.test(bucketName));
}

/**
 * Check if a KV namespace name indicates it's a test namespace
 */
function isTestKVNamespace(namespaceName: string): boolean {
  const testPatterns = [
    /^TEST_/,                      // TEST_SESSION_STORE
    /_TEST$/,                      // SESSION_STORE_TEST
    /^test-/,                      // test-namespace
    /-test-/,                      // namespace-test-123
    /^vitest-/,                    // vitest-namespace
    /^temp-/,                      // temp-namespace
  ];
  
  return testPatterns.some(pattern => pattern.test(namespaceName));
}

/**
 * Check if a D1 database name indicates it's a test database
 */
function isTestDatabase(databaseName: string): boolean {
  const testPatterns = [
    /^test-/,                      // test-database
    /-test$/,                      // database-test
    /-test-/,                      // database-test-123
    /^temp-/,                      // temp-database
    /^vitest-/,                    // vitest-database
    /^godwear-test/,               // godwear-test-db
  ];
  
  return testPatterns.some(pattern => pattern.test(databaseName));
}
