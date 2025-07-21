/**
 * Zod Compatibility Layer
 *
 * This file provides compatibility functions for Zod v4 that maintain the v3 API.
 * It allows existing code to work with minimal changes while using Zod v4.
 */
import { z } from "zod";
/**
 * Compatibility wrapper for z.union that works with both Zod v3 and v4
 * In v3, the function took (schemas[])
 * In v4, it requires (schemas[], params?)
 */
export declare function createUnion(options: z.ZodTypeAny[]): ZodUnion<T>;
/**
 * Compatibility wrapper for z.discriminatedUnion that works with both Zod v3 and v4
 * In v3, the function took (discriminator, schemas[])
 * In v4, it requires (discriminator, schemas[], params?)
 */
export declare function createDiscriminatedUnion(discriminator: string, options: z.ZodObject<any>[]): ZodDiscriminatedUnion<Discriminator, Types>;
/**
 * Helper function to create API response schemas with proper discriminated union
 */
export declare function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T, options?: {
    includeMeta?: boolean;
    metaSchema?: z.ZodTypeAny;
}): ZodDiscriminatedUnion<Discriminator, Types>;
/**
 * Helper function to create health check response schemas
 */
export declare function createHealthCheckResponseSchema(): z.ZodObject<{
    status: z.ZodEnum<{
        healthy: "healthy";
        degraded: "degraded";
        unhealthy: "unhealthy";
    }>;
    service: z.ZodString;
    timestamp: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    dependencies: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
    uptime: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * String format compatibility functions
 * In v3, these were methods on z.string()
 * In v4, they are top-level functions
 */
export declare function createEmailSchema(): z.ZodString;
export declare function createUuidSchema(): z.ZodString;
export declare function createUrlSchema(): z.ZodString;
export declare function createDatetimeSchema(): z.ZodISODateTime;
/**
 * Object method compatibility functions
 * In v3, these were methods on z.object()
 * In v4, they are top-level functions or require different params
 */
export declare function createStrictObject<T extends z.ZodRawShape>(shape: T): z.ZodObject<{ -readonly [P in keyof T]: T[P]; }, z.core.$strict>;
export declare function createPassthroughObject<T extends z.ZodRawShape>(shape: T): z.ZodObject<{ -readonly [P in keyof T]: T[P]; }, z.core.$loose>;
/**
 * Error customization compatibility functions
 * In v3, error customization used message, invalid_type_error, and required_error
 * In v4, it uses a unified error parameter
 */
export declare function createStringWithErrorMessage(message: string): z.ZodString;
export declare function createNumberWithErrorMessage(message: string): z.ZodNumber;
/**
 * REMOVED: Monkey patching approach was causing issues with Zod v4
 * Instead, use the compatibility functions above.
 */
//# sourceMappingURL=zod-compat.d.ts.map