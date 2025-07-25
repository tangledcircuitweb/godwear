import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createApiResponseSchema } from "./zod-compat";

/**
 * Type helper for inferring Zod schema types
 */
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>;

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

/**
 * Pagination parameters schema for requests
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Generic API response wrapper schema
 * @deprecated Use createApiResponseSchema from zod-compat.ts instead
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
  options: {
    includeMeta?: boolean;
    metaSchema?: z.ZodTypeAny;
  } = {}
) => {
  return createApiResponseSchema(dataSchema, options);
};

/**
 * Response metadata schema
 */
export const responseMetaSchema = z.object({
  timestamp: z.string().datetime().optional(),
  requestId: z.string().optional(),
  version: z.string().optional(),
  service: z.string().optional(),
});

/**
 * Paginated response schema
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
  // Create a schema for paginated responses
  return z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
  });
};

/**
 * Base record schema for database entities
 */
export const baseRecordSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Create entity schema with base record fields
 */
export function createEntitySchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    ...baseRecordSchema.shape,
    ...shape,
  });
}

/**
 * Parse data with Zod schema and throw on error
 */
export function parseData<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

/**
 * Parse data with Zod schema and return null on error
 */
export function safeParse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * Enhanced validator for Hono routes with better error handling
 * This is a wrapper around zValidator that adds better error handling
 */
// @ts-ignore
export const validator = zValidator;

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
  MAILERSEND_FROM_EMAIL: z.string().optional(),
  MAILERSEND_FROM_NAME: z.string().optional(),
  MAILERSEND_BASE_URL: z.string().optional(),
  MAILERSEND_TEMPLATE_DIR: z.string().optional(),
  // Base Application URLs and Assets
  BASE_URL: z.string().optional(),
  LOGO_URL: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),
  SECURITY_IMAGE_URL: z.string().optional(),
  SHIPPING_IMAGE_URL: z.string().optional(),
  // Email Queue Configuration
  EMAIL_QUEUE_MAX_CONCURRENT: z.string().optional(),
  EMAIL_QUEUE_RATE_CRITICAL: z.string().optional(),
  EMAIL_QUEUE_RATE_HIGH: z.string().optional(),
  EMAIL_QUEUE_RATE_MEDIUM: z.string().optional(),
  EMAIL_QUEUE_RATE_LOW: z.string().optional(),
  EMAIL_QUEUE_RETRY_DELAY: z.string().optional(),
  EMAIL_QUEUE_MAX_RETRIES: z.string().optional(),
  EMAIL_QUEUE_BATCH_SIZE: z.string().optional(),
  // Enhanced Email Queue Configuration
  EMAIL_INTERVAL_CRITICAL: z.string().optional(),
  EMAIL_INTERVAL_HIGH: z.string().optional(),
  EMAIL_INTERVAL_MEDIUM: z.string().optional(),
  EMAIL_INTERVAL_LOW: z.string().optional(),
  EMAIL_INTERVAL_TESTING: z.string().optional(),
  EMAIL_QUEUE_RETRY_DELAYS: z.string().optional(),
  EMAIL_QUEUE_PERSISTENCE_KEY: z.string().optional(),
  EMAIL_QUEUE_MAX_SIZE: z.string().optional(),
  EMAIL_QUEUE_PROCESSING_INTERVAL: z.string().optional(),
  EMAIL_QUEUE_CLEANUP_INTERVAL: z.string().optional(),
  EMAIL_QUEUE_MAX_AGE: z.string().optional(),
  EMAIL_QUEUE_PRIORITY_BOOST_RETRY: z.string().optional(),
  EMAIL_QUEUE_PRIORITY_BOOST_WAIT: z.string().optional(),
  EMAIL_TESTING_MODE: z.string().optional(),
  EMAIL_DOMAIN_THROTTLES: z.string().optional(),
  // Transactional Email Configuration
  EMAIL_MAX_RETRIES: z.string().optional(),
  EMAIL_RETRY_INITIAL_DELAY: z.string().optional(),
  EMAIL_RETRY_MAX_DELAY: z.string().optional(),
  EMAIL_RETRY_FACTOR: z.string().optional(),
  EMAIL_TEST_MODE: z.string().optional(),
  // Test Configuration
  TEST_EMAIL: z.string().optional(),
  TEST_EMAIL_TEMPLATE_DIR: z.string().optional(),
  // Service Type Configuration
  EMAIL_SERVICE_TYPE: z.string().optional(),
  EMAIL_ANALYTICS_SERVICE_TYPE: z.string().optional(),
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
