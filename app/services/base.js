/**
 * Simple console logger implementation
 */
export class ConsoleLogger {
  info(_message, _meta) {
    // No-op console logger for production
  }
  warn(_message, _meta) {
    // No-op console logger for production
  }
  error(_message, _error, _meta) {
    // No-op console logger for production
  }
  debug(_message, _meta) {
    // No-op console logger for production
  }
}
/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  services = new Map();
  dependencies;
  constructor(dependencies) {
    this.dependencies = {
      ...dependencies,
      logger: dependencies.logger || new ConsoleLogger(),
    };
  }
  /**
   * Register a service in the container
   */
  register(service) {
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
  get(serviceName) {
    return this.services.get(serviceName);
  }
  /**
   * Get all registered services
   */
  getAllServices() {
    return Array.from(this.services.values());
  }
  /**
   * Health check for all services
   */
  async healthCheck() {
    const results = {};
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
//# sourceMappingURL=base.js.map
