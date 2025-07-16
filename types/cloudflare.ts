// Cloudflare bindings interface
export interface CloudflareBindings {
  GODWEAR_KV: KVNamespace;
  DB: D1Database;
  // Session and Cache KV Namespaces
  SESSION_STORE: KVNamespace;
  CACHE: KVNamespace;
  USER_SESSIONS: KVNamespace;
  // R2 Storage
  ASSETS: R2Bucket;
  // OAuth Configuration
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  // JWT Secret
  JWT_SECRET?: string;
  // Email Service Configuration
  // SendGrid Configuration (legacy - being replaced by MailerSend)
  SENDGRID_API_KEY?: string;
  // MailerSend Configuration (current email service)
  MAILERSEND_API_KEY?: string;
  // Environment
  NODE_ENV?: string;
  // Domain Configuration
  PRODUCTION_DOMAIN?: string;
  STAGING_DOMAIN?: string;
  DEVELOPMENT_DOMAIN?: string;
}
