// Base service types and utilities

export type {
  AuthResult,
  AuthTokens,
  AuthUser,
} from "./auth/auth-service";

// Email service exports
export * from "../emails";
export type {
  BaseEmailService,
  EmailRecipient,
  EmailAttachment,
  RawEmailOptions,
  TemplatedEmailOptions,
  EmailResult,
  EmailPriority,
  QueueItemStatus,
  EmailEvent,
  EmailEventType,
  EmailAnalyticsMetrics,
} from "../emails";

// Service implementations
export * from "./auth/auth-service";
// Re-export commonly used types
export type {
  BaseService,
  ServiceDependencies,
  ServiceHealthStatus,
  ServiceLogger,
} from "./base";
export * from "./base";
export type {
  DetailedHealthCheck,
  SystemHealthStatus,
} from "./health/health-service";
export * from "./health/health-service";
export type {
  EmailNotification,
  NotificationResult,
  WelcomeEmailData,
} from "./notifications/notification-service";
export * from "./notifications/notification-service";
export type { Services } from "./registry";
// Service registry
export * from "./registry";
