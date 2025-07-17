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
export declare class HealthService implements BaseService {
    readonly serviceName = "health-service";
    private env;
    private logger?;
    initialize(dependencies: ServiceDependencies): void;
    /**
     * Get basic system health status
     */
    getSystemHealth(): Promise<SystemHealthStatus>;
    /**
     * Perform detailed health checks with connectivity testing
     */
    getDetailedHealthStatus(): Promise<DetailedHealthCheck>;
    /**
     * Check if a specific service is healthy
     */
    checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus>;
    /**
     * Check KV store health
     */
    private checkKVHealth;
    /**
     * Check database health
     */
    private checkDatabaseHealth;
    /**
     * Check MailerSend health
     */
    private checkMailerSendHealth;
    /**
     * Check Google OAuth health
     */
    private checkGoogleOAuthHealth;
    /**
     * Health check for the health service itself
     */
    healthCheck(): Promise<ServiceHealthStatus>;
}
//# sourceMappingURL=health-service.d.ts.map