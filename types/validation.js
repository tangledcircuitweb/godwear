import { z } from "zod";
// ============================================================================
// AUTH VALIDATION SCHEMAS
// ============================================================================
// OAuth callback validation
export const OAuthCallbackSchema = z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().min(1, "State parameter is required"),
    scope: z.string().optional(),
    authuser: z.string().optional(),
    prompt: z.string().optional(),
});
export const OAuthErrorSchema = z.object({
    error: z.string(),
    error_description: z.string().optional(),
    state: z.string().optional(),
});
// Google OAuth token response
export const GoogleTokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string().optional(),
    scope: z.string(),
    token_type: z.literal("Bearer"),
    id_token: z.string(),
});
// Google user info response
export const GoogleUserInfoSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    verified_email: z.boolean(),
    verifiedEmail: z.boolean().optional().default(false),
    name: z.string(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    picture: z.string().url().optional(),
    locale: z.string().optional(),
});
// JWT payload validation
export const JWTPayloadSchema = z.object({
    sub: z.string(), // User ID
    email: z.string().email(),
    name: z.string(),
    picture: z.string().url().optional(),
    iat: z.number(),
    exp: z.number(),
    iss: z.string(),
    aud: z.string(),
});
// ============================================================================
// API RESPONSE VALIDATION SCHEMAS
// ============================================================================
// Generic API response wrapper
export const ApiResponseSchema = (dataSchema) => z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        data: dataSchema,
    }),
    z.object({
        success: z.literal(false),
        error: z.object({
            code: z.string(),
            message: z.string(),
            details: z.record(z.unknown()).optional(),
            timestamp: z.string().datetime(),
        }),
    }),
]);
// Pagination parameters
export const PaginationParamsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
// Paginated response
export const PaginatedResponseSchema = (itemSchema) => z.object({
    items: z.array(itemSchema),
    pagination: z.object({
        total: z.number().int().min(0),
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1),
        totalPages: z.number().int().min(0),
    }),
});
// ============================================================================
// EMAIL VALIDATION SCHEMAS
// ============================================================================
export const EmailRequestSchema = z.object({
    to: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
    content: z.string().min(1, "Content is required"),
    type: z.enum(["welcome", "notification", "marketing"]).default("notification"),
});
// Welcome email specific schema
export const WelcomeEmailRequestSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
});
export const EmailResponseSchema = z.object({
    messageId: z.string(),
    status: z.enum(["sent", "queued", "failed"]),
    timestamp: z.string().datetime(),
});
// ============================================================================
// ENVIRONMENT VALIDATION SCHEMAS
// ============================================================================
export const CloudflareBindingsSchema = z.object({
    GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
    JWT_SECRET: z.string().min(32, "JWT Secret must be at least 32 characters"),
    SENDGRID_API_KEY: z.string().min(1, "SendGrid API key is required"),
    PRODUCTION_DOMAIN: z.string().url().optional(),
    STAGING_DOMAIN: z.string().url().optional(),
    DEVELOPMENT_DOMAIN: z.string().url().optional(),
});
//# sourceMappingURL=validation.js.map