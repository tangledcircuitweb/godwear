#!/usr/bin/env tsx

/**
 * Manual cleanup script for test resources
 * Run this if tests are interrupted and resources aren't cleaned up automatically
 * 
 * Usage: npm run cleanup-tests
 */

import { execSync } from 'child_process';

async function main() {
  console.log('🧹 Manual test resource cleanup started...\n');
  
  try {
    // Import and run the global teardown function
    const { default: globalTeardown } = await import('../tests/global-teardown');
    await globalTeardown();
    
    console.log('\n✅ Manual cleanup completed successfully');
  } catch (error) {
    console.error('\n❌ Manual cleanup failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
