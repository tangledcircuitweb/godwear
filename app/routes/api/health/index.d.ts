/**
 * Main health check endpoint
 * GET /api/health
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
    status: "healthy" | "degraded" | "unhealthy";
    service: string;
    timestamp: string;
    version?: string | undefined;
    dependencies?: {
        [x: string]: "healthy" | "degraded" | "unhealthy";
    } | undefined;
    uptime?: number | undefined;
}, 200 | 503, "json">)>>];
export default _default;
//# sourceMappingURL=index.d.ts.map