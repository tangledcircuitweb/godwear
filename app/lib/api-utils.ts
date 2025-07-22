import { z } from "zod";

/**
 * API error response schema
 */
export const ApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.any().optional(),
});

/**
 * Response metadata schema
 */
export const ResponseMetaSchema = z.object({
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

/**
 * Create an API error response
 */
export function createApiErrorResponse(
  message: string,
  code?: string,
  details?: any
) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

/**
 * Create an API response with data
 */
export function createApiResponse<T>(data: T, meta?: z.infer<typeof ResponseMetaSchema>) {
  return {
    success: true,
    data,
    meta: meta || {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create a paginated API response
 */
export function createPaginatedApiResponse<T>(
  data: T[],
  pagination: z.infer<typeof PaginationSchema>,
  meta?: z.infer<typeof ResponseMetaSchema>
) {
  return {
    success: true,
    data,
    pagination,
    meta: meta || {
      timestamp: new Date().toISOString(),
    },
  };
}
