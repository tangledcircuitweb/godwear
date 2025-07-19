import type { DatabaseService } from "./database-service";
import { AuditLogRepository } from "./repositories/audit-log-repository";
import { SessionRepository } from "./repositories/session-repository";
import { UserRepository } from "./repositories/user-repository";
/**
 * Repository registry for managing all database repositories
 */
export declare class RepositoryRegistry {
    private databaseService;
    private userRepository?;
    private sessionRepository?;
    private auditLogRepository?;
    constructor(databaseService: DatabaseService);
    /**
     * Get user repository
     */
    getUserRepository(): UserRepository;
    /**
     * Get session repository
     */
    getSessionRepository(): SessionRepository;
    /**
     * Get audit log repository
     */
    getAuditLogRepository(): AuditLogRepository;
    /**
     * Get all repositories
     */
    getAllRepositories(): {
        users: UserRepository;
        sessions: SessionRepository;
        auditLogs: AuditLogRepository;
    };
    /**
     * Initialize all repositories (run any setup needed)
     */
    initialize(): Promise<void>;
    /**
     * Health check for all repositories
     */
    healthCheck(): Promise<{
        status: "healthy" | "degraded" | "unhealthy";
        repositories: Record<string, {
            status: string;
            error?: string;
        }>;
    }>;
}
//# sourceMappingURL=repository-registry.d.ts.map