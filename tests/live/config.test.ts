import { describe, expect, it } from "vitest";
import { TEST_ENDPOINTS, TEST_ENV, TEST_USERS } from "./constants";

describe("Test Configuration", () => {
  it("should have proper test environment constants", () => {
    expect(TEST_ENV.JWT_SECRET).toBeDefined();
    expect(TEST_ENV.BASE_URL).toBe("http://localhost:3000");
  });

  it("should have test user data", () => {
    expect(TEST_USERS.REGULAR_USER.email).toBe("test@godwear.com");
    expect(TEST_USERS.ADMIN_USER.role).toBe("ADMIN");
    expect(TEST_USERS.GOOGLE_USER.provider).toBe("google");
  });

  it("should have API endpoints defined", () => {
    expect(TEST_ENDPOINTS.AUTH.LOGIN).toBe("/api/auth/login");
    expect(TEST_ENDPOINTS.USERS.LIST).toBe("/api/users");
    expect(TEST_ENDPOINTS.USERS.GET("123")).toBe("/api/users/123");
  });

  it("should have access to global test environment", () => {
    // Test that our Vitest configuration is working
    expect(__TEST__).toBe(true);
    expect(__DEV__).toBe(true); // Live config sets DEV to true
    expect(__PROD__).toBe(false);
  });
});
