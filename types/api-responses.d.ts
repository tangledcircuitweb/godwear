/**
 * Standard API Error structure
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    service?: string;
}
/**
 * Generic API Response wrapper - discriminated union for type safety
 */
export type ApiResponse<TData = unknown> = {
    success: true;
    data: TData;
    meta?: ResponseMeta;
} | {
    success: false;
    error: ApiError;
};
/**
 * Response metadata for additional context
 */
export interface ResponseMeta {
    timestamp?: string;
    requestId?: string;
    version?: string;
    service?: string;
}
/**
 * Pagination metadata
 */
export interface PaginationMeta {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}
/**
 * Health check response
 */
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    service: string;
    timestamp: string;
    version?: string;
    dependencies?: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    uptime?: number;
}
/**
 * Authentication responses
 */
export interface AuthSuccessResponse {
    user: {
        id: string;
        email: string;
        name: string;
        picture?: string;
    };
    isNewUser: boolean;
}
export interface LoginResponse {
    redirectUrl: string;
    provider: string;
}
export interface AuthUserResponse {
    authenticated: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        picture?: string;
        loginTime?: string;
        expiresAt?: string;
    };
}
/**
 * Email service responses
 */
export interface EmailSuccessResponse {
    messageId?: string;
    recipient: string;
    service: string;
    status: 'sent' | 'queued' | 'delivered';
}
/**
 * Database operation responses
 */
export interface DatabaseResponse<T = unknown> {
    result: T;
    rowsAffected?: number;
    lastInsertId?: string | number;
    executionTime?: number;
}
export declare const ErrorCodes: {
    readonly AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN";
    readonly AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED";
    readonly AUTH_MISSING_TOKEN: "AUTH_MISSING_TOKEN";
    readonly AUTH_OAUTH_ERROR: "AUTH_OAUTH_ERROR";
    readonly AUTH_STATE_MISMATCH: "AUTH_STATE_MISMATCH";
    readonly AUTH_INVALID_STATE: "AUTH_INVALID_STATE";
    readonly AUTH_TOKEN_EXCHANGE_FAILED: "AUTH_TOKEN_EXCHANGE_FAILED";
    readonly AUTH_USER_INFO_FAILED: "AUTH_USER_INFO_FAILED";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly VALIDATION_MISSING_FIELD: "VALIDATION_MISSING_FIELD";
    readonly VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly SERVICE_CONFIGURATION_ERROR: "SERVICE_CONFIGURATION_ERROR";
    readonly SERVICE_RATE_LIMITED: "SERVICE_RATE_LIMITED";
    readonly SERVICE_QUOTA_EXCEEDED: "SERVICE_QUOTA_EXCEEDED";
    readonly DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR";
    readonly DATABASE_QUERY_ERROR: "DATABASE_QUERY_ERROR";
    readonly DATABASE_CONSTRAINT_ERROR: "DATABASE_CONSTRAINT_ERROR";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED";
    readonly BAD_REQUEST: "BAD_REQUEST";
};
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
/**
 * Create a successful API response
 */
export declare function createSuccessResponse<T>(data: T, meta?: ResponseMeta): ApiResponse<T>;
/**
 * Create an error API response
 */
export declare function createErrorResponse(code: ErrorCode, message: string, details?: Record<string, unknown>, service?: string): ApiResponse<never>;
/**
 * Create a paginated response
 */
export declare function createPaginatedResponse<T>(items: T[], pagination: PaginationMeta, meta?: ResponseMeta): ApiResponse<PaginatedResponse<T>>;
/**
 * Create pagination metadata
 */
export declare function createPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta;
/**
 * Create a health check response
 */
export declare function createHealthResponse(service: string, status?: HealthCheckResponse['status'], dependencies?: Record<string, 'healthy' | 'degraded' | 'unhealthy'>, version?: string): HealthCheckResponse;
/**
 * Type guard to check if response is successful
 */
export declare function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & {
    success: true;
};
/**
 * Type guard to check if response is an error
 */
export declare function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & {
    success: false;
};
//# sourceMappingURL=api-responses.d.ts.map