import { z } from "zod";
export declare const OAuthCallbackSchema: z.ZodObject<{
    code: z.ZodString;
    state: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
    authuser: z.ZodOptional<z.ZodString>;
    prompt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    state: string;
    scope?: string | undefined;
    authuser?: string | undefined;
    prompt?: string | undefined;
}, {
    code: string;
    state: string;
    scope?: string | undefined;
    authuser?: string | undefined;
    prompt?: string | undefined;
}>;
export declare const OAuthErrorSchema: z.ZodObject<{
    error: z.ZodString;
    error_description: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error: string;
    state?: string | undefined;
    error_description?: string | undefined;
}, {
    error: string;
    state?: string | undefined;
    error_description?: string | undefined;
}>;
export declare const GoogleTokenResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    expires_in: z.ZodNumber;
    refresh_token: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
    token_type: z.ZodLiteral<"Bearer">;
    id_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scope: string;
    access_token: string;
    expires_in: number;
    token_type: "Bearer";
    id_token: string;
    refresh_token?: string | undefined;
}, {
    scope: string;
    access_token: string;
    expires_in: number;
    token_type: "Bearer";
    id_token: string;
    refresh_token?: string | undefined;
}>;
export declare const GoogleUserInfoSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    verified_email: z.ZodBoolean;
    verifiedEmail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodString;
    given_name: z.ZodOptional<z.ZodString>;
    family_name: z.ZodOptional<z.ZodString>;
    picture: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    verified_email: boolean;
    verifiedEmail: boolean;
    name: string;
    given_name?: string | undefined;
    family_name?: string | undefined;
    picture?: string | undefined;
    locale?: string | undefined;
}, {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    verifiedEmail?: boolean | undefined;
    given_name?: string | undefined;
    family_name?: string | undefined;
    picture?: string | undefined;
    locale?: string | undefined;
}>;
export declare const JWTPayloadSchema: z.ZodObject<{
    sub: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    picture: z.ZodOptional<z.ZodString>;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
    iss: z.ZodString;
    aud: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    sub: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    picture?: string | undefined;
}, {
    email: string;
    name: string;
    sub: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    picture?: string | undefined;
}>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodDiscriminatedUnion<"success", [z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>[k_1]; } : never>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    }, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    };
}, {
    success: false;
    error: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    };
}>]>;
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const PaginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    items: z.ZodArray<T, "many">;
    pagination: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    items: T["_output"][];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}, {
    items: T["_input"][];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const EmailRequestSchema: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    content: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["welcome", "notification", "marketing"]>>;
}, "strip", z.ZodTypeAny, {
    type: "welcome" | "marketing" | "notification";
    to: string;
    subject: string;
    content: string;
}, {
    to: string;
    subject: string;
    content: string;
    type?: "welcome" | "marketing" | "notification" | undefined;
}>;
export declare const WelcomeEmailRequestSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
}, {
    email: string;
    name: string;
}>;
export declare const EmailResponseSchema: z.ZodObject<{
    messageId: z.ZodString;
    status: z.ZodEnum<["sent", "queued", "failed"]>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "sent" | "queued" | "failed";
    messageId: string;
    timestamp: string;
}, {
    status: "sent" | "queued" | "failed";
    messageId: string;
    timestamp: string;
}>;
export declare const CloudflareBindingsSchema: z.ZodObject<{
    GOOGLE_CLIENT_ID: z.ZodString;
    GOOGLE_CLIENT_SECRET: z.ZodString;
    JWT_SECRET: z.ZodString;
    SENDGRID_API_KEY: z.ZodString;
    PRODUCTION_DOMAIN: z.ZodOptional<z.ZodString>;
    STAGING_DOMAIN: z.ZodOptional<z.ZodString>;
    DEVELOPMENT_DOMAIN: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    SENDGRID_API_KEY: string;
    PRODUCTION_DOMAIN?: string | undefined;
    STAGING_DOMAIN?: string | undefined;
    DEVELOPMENT_DOMAIN?: string | undefined;
}, {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    SENDGRID_API_KEY: string;
    PRODUCTION_DOMAIN?: string | undefined;
    STAGING_DOMAIN?: string | undefined;
    DEVELOPMENT_DOMAIN?: string | undefined;
}>;
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;
export type OAuthError = z.infer<typeof OAuthErrorSchema>;
export type GoogleTokenResponse = z.infer<typeof GoogleTokenResponseSchema>;
export type GoogleUserInfo = z.infer<typeof GoogleUserInfoSchema>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export type EmailRequest = z.infer<typeof EmailRequestSchema>;
export type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>;
export type EmailResponse = z.infer<typeof EmailResponseSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<z.ZodType<T>>>>;
//# sourceMappingURL=validation.d.ts.map