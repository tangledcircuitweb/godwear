import type { CloudflareBindings } from "../../../types/cloudflare";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";

export interface SystemHealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  services: Record<string, ServiceHealthStatus>;
  dependencies: Record<string, "healthy" | "unhealthy">;
  timestamp: string;
}

export interface DetailedHealthCheck extends Record<string, unknown> {
  kv: {
    status: "healthy" | "error";
    data?: unknown;
    error?: string;
    responseTime?: number;
  };
  database: {
    status: "healthy" | "error";
    data?: unknown;
    error?: string;
    responseTime?: number;
  };
  message: string;
  timestamp: string;
}

/**
 * Health monitoring service for system status checks
 */
export class HealthService implements BaseService {
  readonly serviceName = "health-service";

  private env!: CloudflareBindings;
  private logger?: any;

  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
  }

  /**
   * Get basic system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const timestamp = new Date().toISOString();

    // Check basic service dependencies
    const dependencies = {
      kv: this.env.GODWEAR_KV ? ("healthy" as const) : ("unhealthy" as const),
      database: this.env.DB ? ("healthy" as const) : ("unhealthy" as const),
      mailersend: this.env.MAILERSEND_API_KEY ? ("healthy" as const) : ("unhealthy" as const),
      google_oauth:
        this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET
          ? ("healthy" as const)
          : ("unhealthy" as const),
    };

    // Determine overall status
    const unhealthyServices = Object.values(dependencies).filter(
      (status) => status === "unhealthy"
    );
    const overall =
      unhealthyServices.length === 0
        ? ("healthy" as const)
        : unhealthyServices.length < Object.keys(dependencies).length
          ? ("degraded" as const)
          : ("unhealthy" as const);

    return {
      overall,
      services: {}, // This would be populated by the service container
      dependencies,
      timestamp,
    };
  }

  /**
   * Perform detailed health checks with connectivity testing
   */
  async getDetailedHealthStatus(): Promise<DetailedHealthCheck> {
    const timestamp = new Date().toISOString();

    // Initialize health status
    const healthStatus: DetailedHealthCheck = {
      kv: { status: "healthy" },
      database: { status: "healthy" },
      message: "System health check completed",
      timestamp,
    };

    // Test KV connectivity
    const kvStartTime = Date.now();
    try {
      const testKey = `health-check-${Date.now()}`;
      const testData = {
        message: "Health check test",
        timestamp,
      };

      await this.env.GODWEAR_KV.put(testKey, JSON.stringify(testData));
      const kvValue = await this.env.GODWEAR_KV.get(testKey, "json");

      // Clean up test data
      await this.env.GODWEAR_KV.delete(testKey);

      healthStatus.kv = {
        status: "healthy",
        data: kvValue,
        responseTime: Date.now() - kvStartTime,
      };
    } catch (error) {
      healthStatus.kv = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown KV error",
        responseTime: Date.now() - kvStartTime,
      };
    }

    // Test D1 database connectivity
    const dbStartTime = Date.now();
    try {
      const dbResult = await this.env.DB.prepare(
        "SELECT 1 as health_check, datetime('now') as timestamp"
      ).first();

      healthStatus.database = {
        status: "healthy",
        data: dbResult,
        responseTime: Date.now() - dbStartTime,
      };
    } catch (error) {
      healthStatus.database = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown database error",
        responseTime: Date.now() - dbStartTime,
      };
    }

    // Update message based on results
    const hasErrors =
      healthStatus.kv.status === "error" || healthStatus.database.status === "error";
    if (hasErrors) {
      healthStatus.message = "System health check completed with errors";
    }

    return healthStatus;
  }

  /**
   * Check if a specific service is healthy
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus> {
    switch (serviceName) {
      case "kv":
        return this.checkKVHealth();
      case "database":
        return this.checkDatabaseHealth();
      case "mailersend":
        return this.checkMailerSendHealth();
      case "google_oauth":
        return this.checkGoogleOAuthHealth();
      default:
        return {
          status: "unhealthy",
          message: `Unknown service: ${serviceName}`,
        };
    }
  }

  /**
   * Check KV store health
   */
  private async checkKVHealth(): Promise<ServiceHealthStatus> {
    if (!this.env.GODWEAR_KV) {
      return {
        status: "unhealthy",
        message: "KV store not configured",
      };
    }

    try {
      const testKey = `health-${Date.now()}`;
      await this.env.GODWEAR_KV.put(testKey, "test");
      const value = await this.env.GODWEAR_KV.get(testKey);
      await this.env.GODWEAR_KV.delete(testKey);

      return {
        status: value === "test" ? "healthy" : "degraded",
        message: "KV store is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "KV store connection failed",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ServiceHealthStatus> {
    if (!this.env.DB) {
      return {
        status: "unhealthy",
        message: "Database not configured",
      };
    }

    try {
      const result = await this.env.DB.prepare("SELECT 1 as test").first();

      return {
        status: result ? "healthy" : "degraded",
        message: "Database is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database connection failed",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  }

  /**
   * Check MailerSend health
   */
  private checkMailerSendHealth(): ServiceHealthStatus {
    if (!this.env.MAILERSEND_API_KEY) {
      return {
        status: "unhealthy",
        message: "MailerSend API key not configured",
      };
    }

    return {
      status: "healthy",
      message: "MailerSend is configured",
    };
  }

  /**
   * Check Google OAuth health
   */
  private checkGoogleOAuthHealth(): ServiceHealthStatus {
    const hasClientId = !!this.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!this.env.GOOGLE_CLIENT_SECRET;

    if (!(hasClientId && hasClientSecret)) {
      return {
        status: "unhealthy",
        message: "Google OAuth credentials not configured",
        details: {
          clientId: hasClientId,
          clientSecret: hasClientSecret,
        },
      };
    }

    return {
      status: "healthy",
      message: "Google OAuth is configured",
    };
  }

  /**
   * Health check for the health service itself
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    try {
      const systemHealth = await this.getSystemHealth();

      return {
        status: systemHealth.overall === "healthy" ? "healthy" : "degraded",
        message: `Health service operational - system is ${systemHealth.overall}`,
        details: systemHealth.dependencies,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Health service check failed",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  }
}
