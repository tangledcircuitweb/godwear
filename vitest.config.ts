import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Use node environment for now, we'll add Miniflare integration later
    env: {
      // Environment variables for testing
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
      MAILERSEND_API_KEY: 'test-mailersend-api-key',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      BASE_URL: 'http://localhost:3000',
      OAUTH_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
    },
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'e2e/',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/types/**',
        'dist/',
        'public/',
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
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },
  },
  resolve: {
    alias: {
      // Path aliases matching our project structure
      '@': path.resolve(__dirname, './app'),
      '@types': path.resolve(__dirname, './app/types'),
      '@lib': path.resolve(__dirname, './app/lib'),
      '@services': path.resolve(__dirname, './app/services'),
      '@middleware': path.resolve(__dirname, './app/middleware'),
      '@utils': path.resolve(__dirname, './app/utils'),
      '@routes': path.resolve(__dirname, './app/routes'),
      '@test': path.resolve(__dirname, './src/test'),
      '@mocks': path.resolve(__dirname, './src/test/mocks'),
      '@fixtures': path.resolve(__dirname, './src/test/fixtures'),
    },
  },
  // Vite configuration for testing
  define: {
    // Define global constants for testing
    __TEST__: true,
    __DEV__: false,
    __PROD__: false,
  },
  // Optimize dependencies for testing
  optimizeDeps: {
    include: [
      'vitest',
      'msw',
      'zod',
      '@hono/zod-validator',
    ],
  },
});
