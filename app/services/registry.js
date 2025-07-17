import { AuthService } from "./auth/auth-service";
import { ServiceContainer } from "./base";
import { D1DatabaseService, RepositoryRegistry } from "./database";
import { HealthService } from "./health/health-service";
import { NotificationService } from "./notifications/notification-service";
/**
 * Service registry for managing all application services
 */
export class ServiceRegistry {
  container;
  // Service instances
  database;
  repositories;
  auth;
  health;
  notifications;
  constructor(dependencies) {
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
  getContainer() {
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
  getService(serviceName) {
    return this.container.get(serviceName);
  }
  /**
   * Initialize all services and run database migrations
   */
  async initializeAll() {
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
  resetDatabaseMetrics() {
    this.database.resetMetrics();
  }
  /**
   * Determine overall health status
   */
  determineOverallHealth(serviceHealth, repositoryHealth) {
    const serviceStatuses = Object.values(serviceHealth).map((s) => s.status);
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
export function createServiceRegistry(dependencies) {
  return new ServiceRegistry(dependencies);
}
//# sourceMappingURL=registry.js.map
