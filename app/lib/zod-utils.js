import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createApiResponseSchema, createDiscriminatedUnion } from "./zod-compat";
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
export const apiResponseSchema = (dataSchema, options = {}) => {
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
export const paginatedResponseSchema = (itemSchema) => {
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
export function createEntitySchema(shape) {
    return z.object({
        ...baseRecordSchema.shape,
        ...shape,
    });
}
/**
 * Parse data with Zod schema and throw on error
 */
export function parseData(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
}
/**
 * Parse data with Zod schema and return null on error
 */
export function safeParse(schema, data) {
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
    GODWEAR_KV: z.custom(),
    DB: z.custom(),
    // Session and Cache KV Namespaces
    SESSION_STORE: z.custom(),
    CACHE: z.custom(),
    USER_SESSIONS: z.custom(),
    // R2 Storage
    ASSETS: z.custom(),
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
//# sourceMappingURL=zod-utils.js.map