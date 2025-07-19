import type { CloudflareBindings } from "../lib/zod-utils";
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
    request?: Request | undefined;
    logger?: ServiceLogger | undefined;
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
export declare class ConsoleLogger implements ServiceLogger {
    info(_message: string, _meta?: Record<string, unknown>): void;
    warn(_message: string, _meta?: Record<string, unknown>): void;
    error(_message: string, _error?: Error, _meta?: Record<string, unknown>): void;
    debug(_message: string, _meta?: Record<string, unknown>): void;
}
/**
 * Service container for dependency injection
 */
export declare class ServiceContainer {
    private services;
    private dependencies;
    constructor(dependencies: ServiceDependencies);
    /**
     * Register a service in the container
     */
    register<T extends BaseService>(service: T): T;
    /**
     * Get a service from the container
     */
    get<T extends BaseService>(serviceName: string): T | undefined;
    /**
     * Get all registered services
     */
    getAllServices(): BaseService[];
    /**
     * Health check for all services
     */
    healthCheck(): Promise<Record<string, ServiceHealthStatus>>;
}
/**
 * Service factory function type
 */
export type ServiceFactory<T extends BaseService> = (dependencies: ServiceDependencies) => T;
//# sourceMappingURL=base.d.ts.map