import { AuthService } from "./auth/auth-service";
import { type BaseService, ServiceContainer, type ServiceDependencies } from "./base";
import { D1DatabaseService, RepositoryRegistry } from "./database";
import { HealthService } from "./health/health-service";
import { NotificationService } from "./notifications/notification-service";
/**
 * Service registry for managing all application services
 */
export declare class ServiceRegistry {
    private container;
    readonly database: D1DatabaseService;
    readonly repositories: RepositoryRegistry;
    readonly auth: AuthService;
    readonly health: HealthService;
    readonly notifications: NotificationService;
    constructor(dependencies: ServiceDependencies);
    /**
     * Get the service container
     */
    getContainer(): ServiceContainer;
    /**
     * Get all services health status
     */
    getHealthStatus(): Promise<{
        services: Record<string, import("./base").ServiceHealthStatus>;
        repositories: {
            status: "healthy" | "degraded" | "unhealthy";
            repositories: Record<string, {
                status: string;
                error?: string;
            }>;
        };
        overall: "healthy" | "degraded" | "unhealthy";
    }>;
    /**
     * Get a specific service by name
     */
    getService<T extends BaseService>(serviceName: string): T | undefined;
    /**
     * Initialize all services and run database migrations
     */
    initializeAll(): Promise<void>;
    /**
     * Get database metrics
     */
    getDatabaseMetrics(): import("./database").DatabaseMetrics;
    /**
     * Reset database metrics
     */
    resetDatabaseMetrics(): void;
    /**
     * Determine overall health status
     */
    private determineOverallHealth;
}
/**
 * Factory function to create service registry
 */
export declare function createServiceRegistry(dependencies: ServiceDependencies): ServiceRegistry;
/**
 * Type for accessing services from the registry
 */
export type Services = {
    database: D1DatabaseService;
    repositories: RepositoryRegistry;
    auth: AuthService;
    health: HealthService;
    notifications: NotificationService;
};
//# sourceMappingURL=registry.d.ts.map