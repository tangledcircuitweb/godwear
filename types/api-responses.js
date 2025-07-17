// ============================================================================
// STANDARDIZED API RESPONSE TYPES
// ============================================================================
// ============================================================================
// ERROR CODE CONSTANTS
// ============================================================================
export const ErrorCodes = {
    // Authentication errors
    AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_MISSING_TOKEN: 'AUTH_MISSING_TOKEN',
    AUTH_OAUTH_ERROR: 'AUTH_OAUTH_ERROR',
    AUTH_STATE_MISMATCH: 'AUTH_STATE_MISMATCH',
    AUTH_INVALID_STATE: 'AUTH_INVALID_STATE',
    AUTH_TOKEN_EXCHANGE_FAILED: 'AUTH_TOKEN_EXCHANGE_FAILED',
    AUTH_USER_INFO_FAILED: 'AUTH_USER_INFO_FAILED',
    // Validation errors
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    // Service errors
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    SERVICE_CONFIGURATION_ERROR: 'SERVICE_CONFIGURATION_ERROR',
    SERVICE_RATE_LIMITED: 'SERVICE_RATE_LIMITED',
    SERVICE_QUOTA_EXCEEDED: 'SERVICE_QUOTA_EXCEEDED',
    // Database errors
    DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
    DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
    DATABASE_CONSTRAINT_ERROR: 'DATABASE_CONSTRAINT_ERROR',
    // General errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    BAD_REQUEST: 'BAD_REQUEST',
};
// ============================================================================
// RESPONSE BUILDER UTILITIES
// ============================================================================
/**
 * Create a successful API response
 */
export function createSuccessResponse(data, meta) {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
}
/**
 * Create an error API response
 */
export function createErrorResponse(code, message, details, service) {
    const error = {
        code,
        message,
        timestamp: new Date().toISOString(),
    };
    if (details) {
        error.details = details;
    }
    if (service) {
        error.service = service;
    }
    return {
        success: false,
        error,
    };
}
/**
 * Create a paginated response
 */
export function createPaginatedResponse(items, pagination, meta) {
    return createSuccessResponse({
        items,
        pagination,
    }, meta);
}
/**
 * Create pagination metadata
 */
export function createPaginationMeta(total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    return {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
/**
 * Create a health check response
 */
export function createHealthResponse(service, status = 'healthy', dependencies, version) {
    const response = {
        status,
        service,
        timestamp: new Date().toISOString(),
    };
    if (version) {
        response.version = version;
    }
    if (dependencies) {
        response.dependencies = dependencies;
    }
    const uptime = process.uptime?.();
    if (uptime !== undefined) {
        response.uptime = uptime;
    }
    return response;
}
// ============================================================================
// TYPE GUARDS
// ============================================================================
/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse(response) {
    return response.success === true;
}
/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response) {
    return response.success === false;
}
//# sourceMappingURL=api-responses.js.map