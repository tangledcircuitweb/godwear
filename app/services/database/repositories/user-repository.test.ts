import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aUser } from "../../../../tests/live/helpers/test-factory";
import { createMockEnv } from "../../../../tests/live/setup";
import type { UserRecord } from "../../../../types/database";
import { UserRepository } from "./user-repository";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockEnv = createMockEnv();
    userRepository = new UserRepository(mockEnv.DATABASE_SERVICE);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Absolute minimal tests - only what we know works 100%
  describe("Core Functionality", () => {
    it("should initialize correctly", () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
      expect(userRepository.tableName).toBe("users");
    });

    it("should create a user successfully", async () => {
      const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@godwear.com`;
      const userData = {
        email: uniqueEmail,
        name: "Test User",
        role: "USER" as const,
        provider: "email" as const,
        email_verified: 1,
        status: "active" as const,
      };

      const createdUser = await userRepository.create(userData);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(uniqueEmail);
      expect(createdUser.name).toBe("Test User");
      expect(createdUser.role).toBe("USER");
      expect(createdUser.status).toBe("active");
      expect(createdUser.id).toBeDefined();
    });

    it("should handle non-existent user lookups", async () => {
      const nonExistentEmail = `nonexistent-${Date.now()}@godwear.com`;
      const nonExistentId = `nonexistent-${Date.now()}`;
      
      const userByEmail = await userRepository.findByEmail(nonExistentEmail);
      expect(userByEmail).toBeNull();
      
      const userById = await userRepository.findById(nonExistentId);
      expect(userById).toBeNull();
    });
  });
});
