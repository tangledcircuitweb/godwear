import { z } from '@hono/zod-openapi';
/**
 * Standard API Error schema
 */
export declare const ApiErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
    service: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Response metadata schema
 */
export declare const ResponseMetaSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    service: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Create API Response schema - discriminated union for type safety
 *
 * @param dataSchema The schema for the data property in successful responses
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A discriminated union schema for API responses
 */
export declare const createApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T, schemaName: string) => any;
/**
 * Pagination parameters schema
 */
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
/**
 * Pagination metadata schema
 */
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
}, z.core.$strip>;
/**
 * Create paginated response schema
 *
 * @param itemSchema The schema for the items in the paginated response
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A schema for paginated responses
 */
export declare const createPaginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T, schemaName: string) => z.ZodObject<{
    items: z.ZodArray<T>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
/**
 * Health check response schema
 */
export declare const HealthCheckResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        healthy: "healthy";
        degraded: "degraded";
        unhealthy: "unhealthy";
    }>;
    service: z.ZodString;
    timestamp: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    uptime: z.ZodOptional<z.ZodNumber>;
    dependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<{
        healthy: "healthy";
        degraded: "degraded";
        unhealthy: "unhealthy";
    }>>>;
}, z.core.$strip>;
/**
 * Health check API response schema
 */
export declare const HealthCheckApiResponseSchema: any;
/**
 * Base record schema for database entities
 */
export declare const BaseRecordSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
/**
 * Create entity schema with base record fields
 *
 * @param shape The shape of the entity schema
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A schema for entities with base record fields
 */
export declare function createEntitySchema<T extends z.ZodRawShape>(shape: T, schemaName: string): z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & T extends infer T_1 ? { -readonly [P in keyof T_1]: ({
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & T)[P]; } : never, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map