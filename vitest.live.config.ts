import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Environment variables for live testing
    env: {
      // Use live environment
      ENVIRONMENT: "development",
      JWT_SECRET: "test-jwt-secret-key-for-testing-only",
      MAILERSEND_API_KEY: "test-mailersend-api-key",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      BASE_URL: "http://localhost:8787", // Live dev server
      OAUTH_REDIRECT_URI: "http://localhost:8787/api/auth/callback",
      // Enable live testing flags - USE ALL REAL CLOUDFLARE SERVICES
      USE_LIVE_KV: "true",
      USE_LIVE_D1: "true", 
      USE_LIVE_R2: "true",
      USE_LIVE_SERVER: "true",
      // Live service IDs
      GODWEAR_KV_NAMESPACE_ID: "3337a52b4f64450ea27fd5065d8f7da2",
      GODWEAR_DB_UUID: "c25066df-2b13-4f53-89e4-59ca96cc9084",
    },
    setupFiles: ["./tests/live/setup-live.ts"],
    globalTeardown: "./tests/global-teardown.js",
    include: [
      "src/**/*.{test,spec}.{js,ts}",
      "tests/**/*.{test,spec}.{js,ts}",
      "app/**/*.{test,spec}.{js,ts}",
    ],
    exclude: ["node_modules/", "dist/", "e2e/", "**/*.d.ts", "**/*.config.*", "**/mockData/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage-live",
      exclude: [
        "node_modules/",
        "tests/",
        "e2e/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "types/**",
        "dist/",
        "public/",
      ],
    },
    // Longer timeouts for live testing (R2 operations can be slow)
    testTimeout: 60000, // 60 seconds for live R2/KV/D1 operations
    hookTimeout: 45000, // 45 seconds for setup/teardown
    // More retries for live testing (network can be flaky)
    retry: 3,
    // Reporter configuration
    reporters: ["verbose"],
    // Run tests serially to avoid conflicts with live resources
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "@types": path.resolve(__dirname, "./app/types"),
      "@lib": path.resolve(__dirname, "./app/lib"),
      "@services": path.resolve(__dirname, "./app/services"),
      "@middleware": path.resolve(__dirname, "./app/middleware"),
      "@utils": path.resolve(__dirname, "./app/utils"),
      "@routes": path.resolve(__dirname, "./app/routes"),
      "@test": path.resolve(__dirname, "./tests/live"),
      "@mocks": path.resolve(__dirname, "./tests/live/mocks"),
      "@fixtures": path.resolve(__dirname, "./tests/live/fixtures"),
    },
  },
  define: {
    __TEST__: true,
    __DEV__: true,
    __PROD__: false,
    __LIVE_TESTING__: true,
  },
  optimizeDeps: {
    include: ["vitest", "msw", "zod", "@hono/zod-validator"],
  },
});
