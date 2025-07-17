import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  apiResponseSchema,
  paginationSchema,
  paginatedResponseSchema,
  parseData,
  safeParse,
  createEntitySchema,
} from "./zod-utils";

describe("Zod Utilities", () => {
  describe("apiResponseSchema", () => {
    it("should validate a successful response", () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      
      const schema = apiResponseSchema(userSchema);
      
      const validData = {
        success: true,
        data: {
          id: "123",
          name: "Test User",
        },
      };
      
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    it("should validate an error response", () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      
      const schema = apiResponseSchema(userSchema);
      
      const errorData = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
          timestamp: new Date().toISOString(),
        },
      };
      
      const result = schema.safeParse(errorData);
      expect(result.success).toBe(true);
    });
  });
  
  describe("paginationSchema", () => {
    it("should validate pagination metadata", () => {
      const validData = {
        total: 100,
        page: 2,
        pageSize: 10,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };
      
      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
  
  describe("paginatedResponseSchema", () => {
    it("should validate a paginated response", () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      
      const schema = paginatedResponseSchema(userSchema);
      
      const validData = {
        items: [
          { id: "1", name: "User 1" },
          { id: "2", name: "User 2" },
        ],
        pagination: {
          total: 100,
          page: 1,
          pageSize: 10,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        },
      };
      
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
  
  describe("parseData", () => {
    it("should parse valid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      
      const validData = {
        name: "Test",
        age: 30,
      };
      
      const result = parseData(schema, validData);
      expect(result).toEqual(validData);
    });
    
    it("should throw on invalid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      
      const invalidData = {
        name: "Test",
        age: "30", // Should be a number
      };
      
      expect(() => parseData(schema, invalidData)).toThrow();
    });
  });
  
  describe("safeParse", () => {
    it("should return parsed data for valid input", () => {
      const schema = z.object({
        name: z.string(),
      });
      
      const validData = {
        name: "Test",
      };
      
      const result = safeParse(schema, validData);
      expect(result).toEqual(validData);
    });
    
    it("should return null for invalid input", () => {
      const schema = z.object({
        name: z.string(),
      });
      
      const invalidData = {
        name: 123, // Should be a string
      };
      
      const result = safeParse(schema, invalidData);
      expect(result).toBeNull();
    });
  });
  
  describe("createEntitySchema", () => {
    it("should create a schema with base record fields", () => {
      const userSchema = createEntitySchema({
        email: z.string().email(),
        name: z.string(),
      });
      
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-02T00:00:00Z",
        email: "test@example.com",
        name: "Test User",
      };
      
      const result = userSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
