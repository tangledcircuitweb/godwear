// ============================================================================
// STANDARDIZED API RESPONSE TYPES
// ============================================================================

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
export type ApiResponse<TData = unknown> = 
  | {
      success: true;
      data: TData;
      meta?: ResponseMeta;
    }
  | {
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

// ============================================================================
// SPECIFIC API RESPONSE TYPES
// ============================================================================

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
  sessionToken?: string;
  expiresAt?: string;
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
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// RESPONSE BUILDER UTILITIES
// ============================================================================

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
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
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  service?: string
): ApiResponse<never> {
  const error: ApiError = {
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
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationMeta,
  meta?: ResponseMeta
): ApiResponse<PaginatedResponse<T>> {
  return createSuccessResponse(
    {
      items,
      pagination,
    },
    meta
  );
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
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
export function createHealthResponse(
  service: string,
  status: HealthCheckResponse['status'] = 'healthy',
  dependencies?: Record<string, 'healthy' | 'degraded' | 'unhealthy'>,
  version?: string
): HealthCheckResponse {
  const response: HealthCheckResponse = {
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
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false } {
  return response.success === false;
}
