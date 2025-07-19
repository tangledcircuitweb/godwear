/**
 * Zod Utilities for GodWear
 * 
 * This file provides standardized utilities and patterns for using Zod
 * throughout the application, following the AI-first codebase principles.
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

/**
 * Standard error map for consistent error messages
 */
export const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "string") {
        return { message: "Must be a text value" };
      }
      if (issue.expected === "number") {
        return { message: "Must be a numeric value" };
      }
      return { message: `Expected ${issue.expected}, received ${issue.received}` };
    
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Unrecognized keys: ${issue.keys.join(", ")}` };
    
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") {
        return { message: "Invalid email address" };
      }
      if (issue.validation === "url") {
        return { message: "Invalid URL format" };
      }
      return { message: "Invalid string format" };
    
    default:
      return { message: ctx.defaultError };
  }
};

/**
 * Configure Zod globally with custom error messages
 */
z.setErrorMap(zodErrorMap);

/**
 * Standard API response schema factory
 * Creates a discriminated union for success/error responses
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      data: dataSchema,
      meta: z.object({
        timestamp: z.string().datetime().optional(),
        requestId: z.string().optional(),
        version: z.string().optional(),
        service: z.string().optional(),
      }).optional(),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional(),
        timestamp: z.string().datetime(),
        service: z.string().optional(),
      }),
    }),
  ]);

/**
 * Standard pagination schema
 */
export const paginationSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

/**
 * Standard pagination parameters schema
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Standard paginated response schema factory
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
  });

/**
 * Enhanced validator for Hono routes with better error handling
 */
export const validator = (schema: any, target = "json") => {
  return zValidator(schema, (result: any, c: any) => {
    if (!result.success) {
      const errors = result.error.format();
      return c.json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Validation failed",
          details: errors,
          timestamp: new Date().toISOString(),
        },
      }, 400);
    }
    return undefined;
  }, target as any);
};

/**
 * Base record schema for database entities
 */
export const baseRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Helper to create a schema for database entities
 */
export const createEntitySchema = <T extends z.ZodRawShape>(shape: T) => {
  return baseRecordSchema.extend(shape);
};

/**
 * Helper to parse and validate external data
 */
export function parseData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
    }
    throw error;
  }
}

/**
 * Helper to safely parse data (returns null on error)
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

/**
 * Cloudflare bindings schema
 */
export const cloudflareBindingsSchema = z.object({
  GODWEAR_KV: z.custom<KVNamespace>(),
  DB: z.custom<D1Database>(),
  // Session and Cache KV Namespaces
  SESSION_STORE: z.custom<KVNamespace>(),
  CACHE: z.custom<KVNamespace>(),
  USER_SESSIONS: z.custom<KVNamespace>(),
  // R2 Storage
  ASSETS: z.custom<R2Bucket>(),
  // OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // JWT Secret
  JWT_SECRET: z.string().optional(),
  // Email Service Configuration
  // SendGrid Configuration (legacy - being replaced by MailerSend)
  SENDGRID_API_KEY: z.string().optional(),
  // MailerSend Configuration (current email service)
  MAILERSEND_API_KEY: z.string().optional(),
  // Environment
  NODE_ENV: z.string().optional(),
  // Domain Configuration
  PRODUCTION_DOMAIN: z.string().optional(),
  STAGING_DOMAIN: z.string().optional(),
  DEVELOPMENT_DOMAIN: z.string().optional(),
});

/**
 * Type helper for Cloudflare bindings
 */
export type CloudflareBindings = z.infer<typeof cloudflareBindingsSchema>;
