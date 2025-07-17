/**
 * Detailed health status endpoint that checks connectivity to KV and D1 database
 * GET /api/health/status
 */
declare const _default: [import("hono/types").H<import("hono").Env, any, {}, Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: {
        code: string;
        message: string;
        details?: {
            [x: string]: never;
        } | undefined;
        timestamp: string;
        service?: string | undefined;
    };
} | {
    success: true;
    meta?: {
        timestamp?: string | undefined;
        requestId?: string | undefined;
        version?: string | undefined;
        service?: string | undefined;
    } | undefined;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: {
        code: string;
        message: string;
        details?: {
            [x: string]: never;
        } | undefined;
        timestamp: string;
        service?: string | undefined;
    };
} | {
    success: true;
    meta?: {
        timestamp?: string | undefined;
        requestId?: string | undefined;
        version?: string | undefined;
        service?: string | undefined;
    } | undefined;
}, 503, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: {
        code: string;
        message: string;
        details?: {
            [x: string]: never;
        } | undefined;
        timestamp: string;
        service?: string | undefined;
    };
} | {
    success: true;
    data: {
        [x: string]: never;
        kv: {
            status: "healthy" | "error";
            data?: never;
            error?: string | undefined;
            responseTime?: number | undefined;
        };
        database: {
            status: "healthy" | "error";
            data?: never;
            error?: string | undefined;
            responseTime?: number | undefined;
        };
        message: string;
        timestamp: string;
    };
    meta?: {
        timestamp?: string | undefined;
        requestId?: string | undefined;
        version?: string | undefined;
        service?: string | undefined;
    } | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>>];
export default _default;
//# sourceMappingURL=status.d.ts.map