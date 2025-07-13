import { AuthService } from "./auth/auth-service";
import { type BaseService, ServiceContainer, type ServiceDependencies } from "./base";
import { D1DatabaseService, RepositoryRegistry } from "./database";
import { HealthService } from "./health/health-service";
import { NotificationService } from "./notifications/notification-service";

/**
 * Service registry for managing all application services
 */
export class ServiceRegistry {
  private container: ServiceContainer;

  // Service instances
  public readonly database: D1DatabaseService;
  public readonly repositories: RepositoryRegistry;
  public readonly auth: AuthService;
  public readonly health: HealthService;
  public readonly notifications: NotificationService;

  constructor(dependencies: ServiceDependencies) {
    this.container = new ServiceContainer(dependencies);

    // Initialize database service first (other services may depend on it)
    this.database = this.container.register(
      new D1DatabaseService({
        enableQueryLogging: dependencies.env.NODE_ENV !== "production",
        enableMetrics: true,
        maxRetries: 3,
        retryDelay: 1000,
        queryTimeout: 30000,
      })
    );

    // Initialize repository registry
    this.repositories = new RepositoryRegistry(this.database);

    // Initialize other services
    this.auth = this.container.register(new AuthService());
    this.health = this.container.register(new HealthService());
    this.notifications = this.container.register(new NotificationService());
  }

  /**
   * Get the service container
   */
  getContainer(): ServiceContainer {
    return this.container;
  }

  /**
   * Get all services health status
   */
  async getHealthStatus() {
    const serviceHealth = await this.container.healthCheck();
    const repositoryHealth = await this.repositories.healthCheck();

    return {
      services: serviceHealth,
      repositories: repositoryHealth,
      overall: this.determineOverallHealth(serviceHealth, repositoryHealth),
    };
  }

  /**
   * Get a specific service by name
   */
  getService<T extends BaseService>(serviceName: string): T | undefined {
    return this.container.get<T>(serviceName);
  }

  /**
   * Initialize all services and run database migrations
   */
  async initializeAll(): Promise<void> {
    // Run database migrations
    await this.database.runMigrations();

    // Initialize repositories
    await this.repositories.initialize();
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics() {
    return this.database.getMetrics();
  }

  /**
   * Reset database metrics
   */
  resetDatabaseMetrics(): void {
    this.database.resetMetrics();
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(
    serviceHealth: Record<string, any>,
    repositoryHealth: { status: string }
  ): "healthy" | "degraded" | "unhealthy" {
    const serviceStatuses = Object.values(serviceHealth).map((s: any) => s.status);
    const allStatuses = [...serviceStatuses, repositoryHealth.status];

    const unhealthyCount = allStatuses.filter((s) => s === "unhealthy").length;
    const degradedCount = allStatuses.filter((s) => s === "degraded").length;

    if (unhealthyCount > 0) {
      return unhealthyCount >= allStatuses.length / 2 ? "unhealthy" : "degraded";
    }

    if (degradedCount > 0) {
      return "degraded";
    }

    return "healthy";
  }
}

/**
 * Factory function to create service registry
 */
export function createServiceRegistry(dependencies: ServiceDependencies): ServiceRegistry {
  return new ServiceRegistry(dependencies);
}

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
