/**
 * Initiate OAuth login
 * GET /api/auth/login
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
    data: {
        redirectUrl: string;
        provider: string;
    };
    meta?: {
        timestamp?: string | undefined;
        requestId?: string | undefined;
        version?: string | undefined;
        service?: string | undefined;
    } | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>>];
export default _default;
//# sourceMappingURL=login.d.ts.map