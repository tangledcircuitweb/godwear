export interface CloudflareBindings {
    GODWEAR_KV: KVNamespace;
    DB: D1Database;
    SESSION_STORE: KVNamespace;
    CACHE: KVNamespace;
    USER_SESSIONS: KVNamespace;
    ASSETS: R2Bucket;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    JWT_SECRET?: string;
    SENDGRID_API_KEY?: string;
    MAILERSEND_API_KEY?: string;
    NODE_ENV?: string;
    PRODUCTION_DOMAIN?: string;
    STAGING_DOMAIN?: string;
    DEVELOPMENT_DOMAIN?: string;
}
//# sourceMappingURL=cloudflare.d.ts.map