// Base service types and utilities

export type {
  AuthResult,
  AuthTokens,
  AuthUser,
} from "./auth/auth-service";

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
