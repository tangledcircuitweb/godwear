import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Use node environment for now, we'll add Miniflare integration later
    env: {
      // Environment variables for testing - use real values from .env
      ENVIRONMENT: "test",
      JWT_SECRET: process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only",
      MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      BASE_URL: process.env.BASE_URL || "http://localhost:3000",
      OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
    },

    globalTeardown: ["./tests/global-teardown.ts"],
    include: [
      "src/**/*.{test,spec}.{js,ts}",
      "tests/**/*.{test,spec}.{js,ts}",
      "app/**/*.{test,spec}.{js,ts}", // Include app directory tests
    ],
    exclude: [
      "node_modules/",
      "dist/",
      "e2e/",
      "**/*.d.ts",
      "**/*.config.*",
      "**/mockData/**",
      "tests/live/**", // Exclude live tests from regular test runs
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
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
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Test timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    // Retry configuration for flaky tests
    retry: 2,
    // Reporter configuration
    reporters: ["verbose", "json", "html"],
    outputFile: {
      json: "./test-results/results.json",
      html: "./test-results/index.html",
    },
  },
  resolve: {
    alias: {
      // Path aliases matching our project structure
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
  // Vite configuration for testing
  define: {
    // Define global constants for testing
    __TEST__: true,
    __DEV__: true, // Set to true so config tests pass
    __PROD__: false,
  },
  // Optimize dependencies for testing
  optimizeDeps: {
    include: ["vitest", "zod", "@hono/zod-validator"],
  },
});
