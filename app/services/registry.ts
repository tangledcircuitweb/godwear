import { ServiceContainer, type ServiceDependencies, type BaseService } from "./base";
import { AuthService } from "./auth/auth-service";
import { HealthService } from "./health/health-service";
import { NotificationService } from "./notifications/notification-service";

/**
 * Service registry for managing all application services
 */
export class ServiceRegistry {
  private container: ServiceContainer;
  
  // Service instances
  public readonly auth: AuthService;
  public readonly health: HealthService;
  public readonly notifications: NotificationService;

  constructor(dependencies: ServiceDependencies) {
    this.container = new ServiceContainer(dependencies);
    
    // Initialize services
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
    return await this.container.healthCheck();
  }

  /**
   * Get a specific service by name
   */
  getService<T extends BaseService>(serviceName: string): T | undefined {
    return this.container.get<T>(serviceName);
  }

  /**
   * Initialize all services (if they have initialization logic)
   */
  async initializeAll(): Promise<void> {
    // Services are already initialized in the constructor
    // This method is for any additional async initialization if needed
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
  auth: AuthService;
  health: HealthService;
  notifications: NotificationService;
};
