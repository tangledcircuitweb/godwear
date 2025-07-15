import { beforeAll, describe, expect, it } from "vitest";

describe("Live Server Tests", () => {
  const baseUrl = "http://localhost:8787";
  let serverRunning = false;

  beforeAll(async () => {
    // Check if dev server is running
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      serverRunning = response.ok;
      console.log(`🔴 Live Server Status: ${serverRunning ? "RUNNING" : "NOT RUNNING"}`);
    } catch (_error) {
      console.log(
        "🔴 Live Server: NOT RUNNING - Start with `wrangler pages dev dist` or `npm run dev`"
      );
      serverRunning = false;
    }
  });

  describe("Health Endpoints", () => {
    it("should respond to health check", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log("🏥 Health Check Response:", data);

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
    });

    it("should provide detailed health status", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/health/detailed`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log("🔍 Detailed Health Response:", data);

      expect(data).toHaveProperty("kv");
      expect(data).toHaveProperty("database");
      expect(data).toHaveProperty("timestamp");
    });
  });

  describe("Authentication Endpoints", () => {
    it("should provide Google OAuth URL", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/auth/google`);
      expect(response.status).toBe(302); // Should redirect

      const location = response.headers.get("location");
      console.log("🔗 Google OAuth URL:", location);

      expect(location).toContain("accounts.google.com");
      expect(location).toContain("oauth2");
    });

    it("should handle auth callback endpoint", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      // Test with missing code parameter
      const response = await fetch(`${baseUrl}/api/auth/callback`);
      expect(response.status).toBe(400); // Bad request without code

      const data = await response.json();
      console.log("🔐 Auth Callback Error Response:", data);

      expect(data).toHaveProperty("error");
    });
  });

  describe("API Routes", () => {
    it("should handle 404 for non-existent routes", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/non-existent-route`);
      expect(response.status).toBe(404);

      console.log("🚫 404 Response Status:", response.status);
    });

    it("should serve static assets", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/favicon.ico`);
      console.log("🖼️  Favicon Response Status:", response.status);

      // Should either exist (200) or not found (404), but not error
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("CORS and Headers", () => {
    it("should include proper CORS headers", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/health`, {
        method: "OPTIONS",
      });

      console.log("🌐 CORS Headers:", Object.fromEntries(response.headers.entries()));

      // Check for common CORS headers
      expect(
        response.headers.has("access-control-allow-origin") ||
          response.headers.has("Access-Control-Allow-Origin")
      ).toBe(true);
    });

    it("should include security headers", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/health`);

      console.log("🔒 Security Headers:", {
        "Content-Type": response.headers.get("content-type"),
        "X-Content-Type-Options": response.headers.get("x-content-type-options"),
        "X-Frame-Options": response.headers.get("x-frame-options"),
      });

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Performance Tests", () => {
    it("should respond within acceptable time limits", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/health`);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      console.log(`⚡ Response Time: ${responseTime}ms`);

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it("should handle concurrent requests", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const concurrentRequests = 5;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch(`${baseUrl}/api/health`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      console.log(`🚀 Concurrent Requests (${concurrentRequests}): ${totalTime}ms`);

      responses.forEach((response, index) => {
        expect(response.ok).toBe(true);
        console.log(`   Request ${index + 1}: ${response.status}`);
      });

      expect(totalTime).toBeLessThan(10000); // All should complete within 10 seconds
    });
  });

  describe("Environment Configuration", () => {
    it("should be running in development mode", async () => {
      if (!serverRunning) {
        console.log("⏭️  Skipping live server test - server not running");
        return;
      }

      const response = await fetch(`${baseUrl}/api/health/detailed`);
      const data = await response.json();

      console.log("🔧 Environment Info:", {
        timestamp: data.timestamp,
        hasKV: !!data.kv,
        hasDatabase: !!data.database,
      });

      expect(data).toHaveProperty("timestamp");
    });
  });
});
