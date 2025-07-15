import type { CloudflareBindings } from "../../types/cloudflare";

/**
 * Base service interface that all services should implement
 */
export interface BaseService {
  /**
   * Service name for logging and debugging
   */
  readonly serviceName: string;

  /**
   * Initialize the service with dependencies
   */
  initialize?(dependencies: ServiceDependencies): Promise<void> | void;

  /**
   * Health check for the service
   */
  healthCheck?(): Promise<ServiceHealthStatus> | ServiceHealthStatus;
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Service dependencies container
 */
export interface ServiceDependencies {
  env: CloudflareBindings;
  request?: Request;
  logger?: ServiceLogger;
}

/**
 * Service logger interface
 */
export interface ServiceLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Simple console logger implementation
 */
export class ConsoleLogger implements ServiceLogger {
  info(_message: string, _meta?: Record<string, unknown>): void {
    // No-op console logger for production
  }

  warn(_message: string, _meta?: Record<string, unknown>): void {
    // No-op console logger for production
  }

  error(_message: string, _error?: Error, _meta?: Record<string, unknown>): void {
    // No-op console logger for production
  }

  debug(_message: string, _meta?: Record<string, unknown>): void {
    // No-op console logger for production
  }
}

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private services = new Map<string, BaseService>();
  private dependencies: ServiceDependencies;

  constructor(dependencies: ServiceDependencies) {
    this.dependencies = {
      ...dependencies,
      logger: dependencies.logger || new ConsoleLogger(),
    };
  }

  /**
   * Register a service in the container
   */
  register<T extends BaseService>(service: T): T {
    this.services.set(service.serviceName, service);

    // Initialize service if it has an initialize method
    if (service.initialize) {
      service.initialize(this.dependencies);
    }

    return service;
  }

  /**
   * Get a service from the container
   */
  get<T extends BaseService>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }

  /**
   * Get all registered services
   */
  getAllServices(): BaseService[] {
    return Array.from(this.services.values());
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<Record<string, ServiceHealthStatus>> {
    const results: Record<string, ServiceHealthStatus> = {};

    const serviceEntries = Array.from(this.services.entries());
    for (const [name, service] of serviceEntries) {
      try {
        if (service.healthCheck) {
          const status = await service.healthCheck();
          results[name] = status;
        } else {
          results[name] = { status: "healthy", message: "No health check implemented" };
        }
      } catch (error) {
        results[name] = {
          status: "unhealthy",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return results;
  }
}

/**
 * Service factory function type
 */
export type ServiceFactory<T extends BaseService> = (dependencies: ServiceDependencies) => T;
