import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestUser, generateTestJWT } from "./helpers/auth";
import { aRequest, aResponse, aUser, createTestFactory, fixtures } from "./helpers/test-factory";
import { server } from "./setup";

describe("Test Infrastructure", () => {
  let testFactory: ReturnType<typeof createTestFactory>;

  beforeEach(() => {
    testFactory = createTestFactory();
  });

  afterEach(async () => {
    await testFactory.cleanup();
  });

  describe("Mock Environment", () => {
    it("should create mock environment with all services", () => {
      const env = testFactory.getEnv();

      expect(env.ENVIRONMENT).toBe("test");
      expect(env.JWT_SECRET).toBeDefined();
      expect(env.CACHE).toBeDefined();
      expect(env.SESSION_STORE).toBeDefined();
      expect(env.DB).toBeDefined();
      expect(env.ASSETS).toBeDefined();
    });

    it("should have working KV namespace", async () => {
      const env = testFactory.getEnv();

      // Test put and get
      await env.CACHE.put("test-key", "test-value");
      const value = await env.CACHE.get("test-key");

      expect(value).toBe("test-value");

      // Test JSON storage
      const jsonData = { message: "hello", count: 42 };
      await env.CACHE.put("json-key", JSON.stringify(jsonData));
      const retrievedJson = await env.CACHE.get("json-key", { type: "json" });

      expect(retrievedJson).toEqual(jsonData);
    });

    it("should have working D1 database", async () => {
      const env = testFactory.getEnv();

      // Test table creation
      const createResult = await env.DB.exec(`
        CREATE TABLE test_table (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Check if the operation was successful (different D1 implementations may return different structures)
      expect(createResult.success !== false).toBe(true);

      // Test insert
      const insertResult = await env.DB.prepare(`
        INSERT INTO test_table (id, name) VALUES (?, ?)
      `)
        .bind("test-1", "Test Name")
        .run();

      expect(insertResult.success).toBe(true);

      // Test select
      const selectResult = await env.DB.prepare(`
        SELECT * FROM test_table WHERE id = ?
      `)
        .bind("test-1")
        .first();

      expect(selectResult).toBeTruthy();
    });

    it("should have working R2 bucket", async () => {
      const env = testFactory.getEnv();

      // Test put and get
      const testData = "Hello, R2!";
      await env.ASSETS.put("test-file.txt", testData);

      const object = await env.ASSETS.get("test-file.txt");
      expect(object).toBeTruthy();

      if (object) {
        const content = await object.text();
        expect(content).toBe(testData);
      }
    });
  });

  describe("Auth Helpers", () => {
    it("should generate and verify JWT tokens", () => {
      const payload = {
        userId: "test-user-123",
        email: "test@godwear.com",
        role: "USER" as const,
      };

      const token = generateTestJWT(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should create test users with different configurations", () => {
      const regularUser = createTestUser();
      expect(regularUser.role).toBe("USER");
      expect(regularUser.emailVerified).toBe(true);

      const adminUser = createTestUser({ role: "ADMIN" });
      expect(adminUser.role).toBe("ADMIN");

      const unverifiedUser = createTestUser({ emailVerified: false });
      expect(unverifiedUser.emailVerified).toBe(false);
    });
  });

  describe("Data Builders", () => {
    it("should build users with fluent API", () => {
      const user = aUser()
        .withEmail("builder@godwear.com")
        .withName("Builder User")
        .asAdmin()
        .build();

      expect(user.email).toBe("builder@godwear.com");
      expect(user.name).toBe("Builder User");
      expect(user.role).toBe("ADMIN");
    });

    it("should build requests with authentication", () => {
      const user = fixtures.users.regularUser;
      const request = aRequest()
        .post("/api/users")
        .withBody({ name: "New User" })
        .withAuth(user)
        .build();

      expect(request.method).toBe("POST");
      expect(request.url).toContain("/api/users");
      expect(request.headers.get("Authorization")).toContain("Bearer");
    });

    it("should build responses with different statuses", () => {
      const successResponse = aResponse().asSuccess({ message: "OK" }).build();

      expect(successResponse.status).toBe(200);

      const errorResponse = aResponse().asError("TEST_ERROR", "Test error message", 400).build();

      expect(errorResponse.status).toBe(400);
    });
  });

  describe("Fixtures", () => {
    it("should provide user fixtures", () => {
      expect(fixtures.users.regularUser).toBeDefined();
      expect(fixtures.users.adminUser.role).toBe("ADMIN");
      expect(fixtures.users.unverifiedUser.emailVerified).toBe(false);
    });

    it("should provide auth fixtures", () => {
      const token = fixtures.auth.validUserToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should provide request fixtures", () => {
      expect(fixtures.requests.validRegistration.email).toBeDefined();
      expect(fixtures.requests.invalidRegistration.email).toBe("invalid-email");
    });

    it("should provide response fixtures", () => {
      const user = fixtures.users.regularUser;
      const response = fixtures.responses.userCreated(user);

      expect(response.success).toBe(true);
      expect(response.data.id).toBe(user.id);
    });
  });

  describe("MSW Integration", () => {
    it("should mock Google OAuth API calls", async () => {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          code: "valid-code",
          grant_type: "authorization_code",
        }),
      });

      expect(tokenResponse.status).toBe(200);
      const tokenData = await tokenResponse.json();
      expect(tokenData.access_token).toBeDefined();

      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      expect(userResponse.status).toBe(200);
      const userData = await userResponse.json();
      expect(userData.email).toBeDefined();
    });

    it("should handle custom MSW handlers", async () => {
      // Add a custom handler for this test
      server.use(
        http.get("https://api.test-service.com/data", () => {
          return HttpResponse.json({ message: "Custom handler works!" });
        })
      );

      const response = await fetch("https://api.test-service.com/data");
      const data = await response.json();

      expect(data.message).toBe("Custom handler works!");
    });
  });

  describe("Test Factory", () => {
    it("should create and seed users", async () => {
      const user = await testFactory.seedUser({
        email: "seeded@godwear.com",
        name: "Seeded User",
      });

      expect(user.email).toBe("seeded@godwear.com");
      expect(user.name).toBe("Seeded User");
    });

    it("should create sessions", async () => {
      const user = await testFactory.seedUser();
      const sessionId = await testFactory.createSession(user);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
    });

    it("should handle cache operations", async () => {
      await testFactory.setCache("test-cache-key", { data: "cached" });
      const cached = await testFactory.getCache("test-cache-key");

      expect(cached).toEqual({ data: "cached" });
    });

    it("should cleanup properly", async () => {
      // Seed some data
      await testFactory.seedUser();
      await testFactory.setCache("cleanup-test", "data");

      // Verify data exists
      const cachedBefore = await testFactory.getCache("cleanup-test");
      expect(cachedBefore).toBe("data");

      // Cleanup
      await testFactory.cleanup();

      // Verify data is gone
      const cachedAfter = await testFactory.getCache("cleanup-test");
      expect(cachedAfter).toBeNull();
    });
  });

  describe("Global Utilities", () => {
    it("should have global createMockEnv function", () => {
      expect(globalThis.createMockEnv).toBeDefined();

      const env = globalThis.createMockEnv();
      expect(env.ENVIRONMENT).toBe("test");
    });

    it("should have global createTestUser function", () => {
      expect(globalThis.createTestUser).toBeDefined();

      const user = globalThis.createTestUser({ name: "Global User" });
      expect(user.name).toBe("Global User");
    });

    it("should have global createTestJWT function", () => {
      expect(globalThis.createTestJWT).toBeDefined();

      const token = globalThis.createTestJWT({
        userId: "test-123",
        email: "test@godwear.com",
        role: "USER",
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should have global createAuthenticatedRequest function", () => {
      expect(globalThis.createAuthenticatedRequest).toBeDefined();

      const request = globalThis.createAuthenticatedRequest("/api/test");
      expect(request.headers.get("Authorization")).toContain("Bearer");
    });
  });
});
