import { z } from '@hono/zod-openapi';
/**
 * Standard API Error schema
 */
export const ApiErrorSchema = z.object({
    code: z.string().openapi({
        description: 'Error code',
        example: 'VALIDATION_ERROR',
    }),
    message: z.string().openapi({
        description: 'Error message',
        example: 'Request validation failed',
    }),
    details: z.record(z.string(), z.unknown()).optional().openapi({
        description: 'Additional error details',
        example: {
            field: 'email',
            issue: 'Invalid email format',
        },
    }),
    timestamp: z.string().openapi({
        description: 'Error timestamp',
        example: '2025-07-20T00:00:00.000Z',
    }),
    service: z.string().optional().openapi({
        description: 'Service that generated the error',
        example: 'auth-api',
    }),
}).openapi('ApiError');
/**
 * Response metadata schema
 */
export const ResponseMetaSchema = z.object({
    timestamp: z.string().datetime().optional().openapi({
        description: 'Response timestamp',
        example: '2025-07-20T00:00:00.000Z',
    }),
    requestId: z.string().optional().openapi({
        description: 'Unique request identifier',
        example: 'req_123456789',
    }),
    version: z.string().optional().openapi({
        description: 'API version',
        example: '1.0.0',
    }),
    service: z.string().optional().openapi({
        description: 'Service that generated the response',
        example: 'auth-api',
    }),
}).openapi('ResponseMeta');
/**
 * Create API Response schema - discriminated union for type safety
 *
 * @param dataSchema The schema for the data property in successful responses
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A discriminated union schema for API responses
 */
export const createApiResponseSchema = (dataSchema, schemaName) => {
    const successSchema = z.object({
        success: z.literal(true).openapi({
            description: 'Indicates successful response',
        }),
        data: dataSchema,
        meta: ResponseMetaSchema.optional(),
    }).openapi(`${schemaName}Success`);
    const errorSchema = z.object({
        success: z.literal(false).openapi({
            description: 'Indicates error response',
        }),
        error: ApiErrorSchema,
    }).openapi(`${schemaName}Error`);
    return z.discriminatedUnion("success", [successSchema, errorSchema], {})
        .openapi(schemaName);
};
/**
 * Pagination parameters schema
 */
export const PaginationParamsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).openapi({
        description: 'Page number (1-based)',
        example: 1,
    }),
    pageSize: z.coerce.number().int().min(1).max(100).default(10).openapi({
        description: 'Number of items per page',
        example: 10,
    }),
    sortBy: z.string().optional().openapi({
        description: 'Field to sort by',
        example: 'createdAt',
    }),
    sortOrder: z.enum(["asc", "desc"]).default("asc").openapi({
        description: 'Sort order',
        example: 'desc',
    }),
}).openapi('PaginationParams');
/**
 * Pagination metadata schema
 */
export const PaginationSchema = z.object({
    page: z.number().int().min(1).openapi({
        description: 'Current page number',
        example: 1,
    }),
    pageSize: z.number().int().min(1).max(100).openapi({
        description: 'Number of items per page',
        example: 10,
    }),
    total: z.number().int().min(0).openapi({
        description: 'Total number of items',
        example: 42,
    }),
    totalPages: z.number().int().min(0).openapi({
        description: 'Total number of pages',
        example: 5,
    }),
}).openapi('Pagination');
/**
 * Create paginated response schema
 *
 * @param itemSchema The schema for the items in the paginated response
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A schema for paginated responses
 */
export const createPaginatedResponseSchema = (itemSchema, schemaName) => {
    return z.object({
        items: z.array(itemSchema).openapi({
            description: 'List of items',
        }),
        pagination: PaginationSchema,
    }).openapi(schemaName);
};
/**
 * Health check response schema
 */
export const HealthCheckResponseSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({
        description: 'Overall system health status',
        example: 'healthy',
    }),
    service: z.string().openapi({
        description: 'Service name',
        example: 'godwear-api',
    }),
    timestamp: z.string().openapi({
        description: 'Health check timestamp',
        example: '2025-07-20T00:00:00.000Z',
    }),
    version: z.string().optional().openapi({
        description: 'API version',
        example: '1.0.0',
    }),
    uptime: z.number().optional().openapi({
        description: 'Service uptime in seconds',
        example: 3600,
    }),
    dependencies: z.record(z.string(), z.enum(['healthy', 'degraded', 'unhealthy'])).optional().openapi({
        description: 'Status of dependent services',
        example: {
            'database': 'healthy',
            'cache': 'healthy',
        },
    }),
}).openapi('HealthCheckResponse');
/**
 * Health check API response schema
 */
export const HealthCheckApiResponseSchema = createApiResponseSchema(HealthCheckResponseSchema, 'HealthCheckApiResponse');
/**
 * Base record schema for database entities
 */
export const BaseRecordSchema = z.object({
    id: z.string().openapi({
        description: 'Unique identifier',
        example: 'rec_123456789',
    }),
    created_at: z.string().openapi({
        description: 'Creation timestamp',
        example: '2025-07-20T00:00:00.000Z',
    }),
    updated_at: z.string().openapi({
        description: 'Last update timestamp',
        example: '2025-07-20T00:00:00.000Z',
    }),
}).openapi('BaseRecord');
/**
 * Create entity schema with base record fields
 *
 * @param shape The shape of the entity schema
 * @param schemaName The name to register the schema with in OpenAPI
 * @returns A schema for entities with base record fields
 */
export function createEntitySchema(shape, schemaName) {
    return z.object({
        ...BaseRecordSchema.shape,
        ...shape,
    }).openapi(schemaName);
}
//# sourceMappingURL=schemas.js.map