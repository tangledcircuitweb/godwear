# Shared Types Inventory

This document catalogs all shared types in the `/types` directory that need to be moved to local files according to the AI-first codebase principles.

## 1. API Response Types (`/types/api-responses.ts`)

### Types Defined:
- `ApiError`
- `ApiResponse<TData>`
- `ResponseMeta`
- `PaginationMeta`
- `PaginatedResponse<T>`
- `HealthCheckResponse`
- `AuthSuccessResponse`
- `LoginResponse`
- `AuthUserResponse`
- `EmailSuccessResponse`
- `DatabaseResponse<T>`
- `ErrorCodes` (const)
- `ErrorCode` (type)

### Utility Functions:
- `createSuccessResponse<T>`
- `createErrorResponse`
- `createPaginatedResponse<T>`
- `createPaginationMeta`
- `createHealthResponse`
- `isSuccessResponse<T>`
- `isErrorResponse<T>`

### Used In:
- `app/routes/api/health/status.ts`
- `app/routes/api/health/index.ts`
- `app/routes/api/auth/logout.ts`
- `app/routes/api/auth/user.ts`
- `app/routes/api/auth/callback.ts`
- `app/routes/api/auth/login.ts`
- `app/routes/api/notifications/welcome.ts`

## 2. Auth Types (`/types/auth.ts`)

### Types Defined:
- `JWTPayload`
- `JWTHeader`
- `UserSession`
- `AuthResponse`

### Used In:
- `app/routes/api/auth/logout.ts`
- `app/routes/api/auth/user.ts`
- `app/services/auth/auth-service.ts`
- `app/services/auth/auth-service.d.ts`

## 3. Cloudflare Bindings (`/types/cloudflare.ts`)

### Types Defined:
- `CloudflareBindings`

### Used In:
- `app/routes/api/health/status.ts`
- `app/routes/api/health/index.ts`
- `app/routes/api/auth/callback.d.ts`
- `app/routes/api/auth/logout.ts`
- `app/routes/api/auth/user.d.ts`
- `app/routes/api/auth/user.ts`
- `app/routes/api/auth/callback.ts`
- `app/routes/api/auth/login.ts`
- `app/routes/api/auth/logout.d.ts`
- `app/routes/api/notifications/welcome.ts`
- `app/routes/api/notifications/welcome.d.ts`
- `app/services/health/health-service.ts`
- `app/services/auth/auth-service.ts`
- `app/services/base.d.ts`
- `app/services/database/database-service.ts`
- `app/services/base.ts`
- `app/services/notifications/notification-service.ts`
- `scripts/init-database.ts`

## 4. Database Types (`/types/database.ts`)

### Types Defined:
- `BaseRecord`
- `UserRecord`
- `SessionRecord`
- `AuditLogRecord`
- `ConfigRecord`
- `QueryResult<T>`
- `SingleQueryResult<T>`
- `DatabaseTransaction`
- `DatabaseConnection`
- `WhereCondition`
- `OrderByClause`
- `JoinClause`
- `QueryOptions`
- `Migration`
- `MigrationRecord`
- `TableSchema`
- `ColumnSchema`
- `IndexSchema`
- `ConstraintSchema`
- `DatabaseConfig`
- `DatabaseMetrics`
- `QueryParams`
- `DatabaseError` (class)
- `QueryTimeoutError` (class)
- `ConnectionError` (class)
- `MigrationError` (class)
- `Repository<T>` (interface)
- `DatabaseService` (interface)
- `ServiceHealthStatus` (interface)

### Used In:
- `app/services/database/database-service.d.ts`
- `app/services/database/repository-registry.ts`
- `app/services/database/repositories/audit-log-repository.d.ts`
- `app/services/database/repositories/session-repository.d.ts`
- `app/services/database/repositories/user-repository.d.ts`
- `app/services/database/repositories/user-repository.ts`
- `app/services/database/repositories/base-repository.ts`
- `app/services/database/repositories/audit-log-repository.ts`
- `app/services/database/repositories/base-repository.d.ts`
- `app/services/database/repositories/session-repository.ts`
- `app/services/database/index.ts`
- `app/services/database/index.d.ts`
- `app/services/database/repository-registry.d.ts`
- `app/services/database/database-service.ts`

## 5. Email Types (`/types/email.ts`)

### Types Defined:
- `EmailRequest`
- `EmailResponse`
- `MailerSendPayload`
- `MailerSendContact`
- `MailerSendContactResponse`
- `MailerSendListResponse<T>`
- `EmailDeliveryStats`
- `MarketingEmailData`
- `EmailCampaignResult`
- `ContactListData`
- `ContactListResult`
- `EmailTemplate`
- `TemplateVariable`

### Used In:
- `app/lib/mailersend.d.ts`
- `app/lib/mailersend.ts`
- `app/services/notifications/notification-service.ts`
- `app/services/notifications/notification-service.d.ts`

## 6. Validation Types (`/types/validation.ts`)

### Schemas Defined:
- `OAuthCallbackSchema`
- `OAuthErrorSchema`
- `GoogleTokenResponseSchema`
- `GoogleUserInfoSchema`
- `JWTPayloadSchema`
- `ApiResponseSchema<T>`
- `PaginationParamsSchema`
- `PaginatedResponseSchema<T>`
- `EmailRequestSchema`
- `WelcomeEmailRequestSchema`
- `EmailResponseSchema`
- `CloudflareBindingsSchema`

### Type Inferences:
- `OAuthCallback`
- `OAuthError`
- `GoogleTokenResponse`
- `GoogleUserInfo`
- `JWTPayload`
- `EmailRequest`
- `WelcomeEmailRequest`
- `EmailResponse`
- `PaginationParams`
- `ApiResponse<T>`
- `PaginatedResponse<T>`

### Used In:
- `app/routes/api/auth/callback.ts`
- `app/routes/api/notifications/welcome.ts`
- `app/services/auth/auth-service.ts`
- `app/services/auth/auth-service.d.ts`

## 7. API Types (`/types/api.ts`)

### Types Defined:
- `ApiResponse<T>`
- `ErrorResponse`
- `SuccessResponse<T>`

### Used In:
- No direct imports found, but likely used through re-exports

## Migration Strategy

For each type, we will:
1. Identify all files that use the type
2. Create a local Zod schema in each file
3. Generate TypeScript types from the Zod schema using `z.infer<typeof SchemaName>`
4. Update all references to use the local type
5. Remove the import from the shared type file

This approach ensures each file is self-contained and follows the AI-first codebase principles outlined in the requirements.
