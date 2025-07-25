// Export analytics interfaces and types
export * from "./email-analytics-service";

// Export implementations
export * from "./in-memory-analytics-service";

// Export API routes
export * from "./analytics-api";
export * from "./tracking-handlers";

// Export factory function
import { InMemoryEmailAnalyticsService } from "./in-memory-analytics-service";
import type { EmailAnalyticsService } from "./email-analytics-service";
import type { ServiceDependencies } from "../../services/base";

/**
 * Email analytics service factory options
 */
export interface EmailAnalyticsServiceFactoryOptions {
  /**
   * Type of email analytics service to create
   * - "memory": In-memory analytics service for development and testing
   * - "database": Database-backed analytics service (not implemented yet)
   */
  type?: "memory" | "database";
  
  /**
   * Service dependencies
   */
  dependencies: ServiceDependencies;
}

/**
 * Create an email analytics service instance based on options
 */
export function createEmailAnalyticsService(options: EmailAnalyticsServiceFactoryOptions): EmailAnalyticsService {
  const { type = "memory", dependencies } = options;
  
  let service!: EmailAnalyticsService; // Definite assignment assertion
  
  switch (type) {
    case "memory":
      service = new InMemoryEmailAnalyticsService();
      break;
    case "database":
      // TODO: Implement database-backed analytics service
      throw new Error("Database-backed analytics service not implemented yet");
    default:
      throw new Error(`Unknown email analytics service type: ${type}`);
  }
  
  // Initialize service if it has an initialize method
  service.initialize?.(dependencies);
  return service;
}
