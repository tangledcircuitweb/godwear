// Base service types and utilities
export * from "./base";

// Service implementations
export * from "./auth/auth-service";
export * from "./health/health-service";
export * from "./notifications/notification-service";

// Service registry
export * from "./registry";

// Re-export commonly used types
export type {
  BaseService,
  ServiceDependencies,
  ServiceHealthStatus,
  ServiceLogger,
} from "./base";

export type {
  AuthUser,
  AuthTokens,
  AuthResult,
} from "./auth/auth-service";

export type {
  SystemHealthStatus,
  DetailedHealthCheck,
} from "./health/health-service";

export type {
  EmailNotification,
  WelcomeEmailData,
  NotificationResult,
} from "./notifications/notification-service";

export type { Services } from "./registry";
