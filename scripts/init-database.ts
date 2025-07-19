#!/usr/bin/env tsx

/**
 * Database initialization script
 * Run with: npx tsx scripts/init-database.ts
 */

import { D1DatabaseService } from "../app/services/database/database-service";
import type { CloudflareBindings } from "../app/lib/zod-utils";

// Mock environment for testing
const mockEnv: CloudflareBindings = {
  DB: {} as D1Database, // This would be the actual D1 database in production
  GODWEAR_KV: {} as KVNamespace,
  NODE_ENV: "development",
};

async function initializeDatabase() {
  console.log("🚀 Initializing database...");

  try {
    // Create database service
    const dbService = new D1DatabaseService({
      enableQueryLogging: true,
      enableMetrics: true,
    });

    // Initialize with mock dependencies
    dbService.initialize({
      env: mockEnv,
      logger: {
        info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ""),
        warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ""),
        error: (msg, error, meta) => console.error(`[ERROR] ${msg}`, error?.message || "", meta || ""),
        debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta || ""),
      },
    });

    console.log("✅ Database service initialized");

    // In a real environment, you would run migrations here:
    // await dbService.runMigrations();
    console.log("📋 Database migrations would run here (skipped in mock environment)");

    // Test basic functionality
    console.log("🔍 Testing database service...");
    
    const metrics = dbService.getMetrics();
    console.log("📊 Initial metrics:", metrics);

    console.log("✅ Database initialization completed successfully!");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { initializeDatabase };
