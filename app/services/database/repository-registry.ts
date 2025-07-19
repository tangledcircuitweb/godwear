import type { DatabaseService } from "./database-service";
import { AuditLogRepository } from "./repositories/audit-log-repository";
import { SessionRepository } from "./repositories/session-repository";
import { UserRepository } from "./repositories/user-repository";

/**
 * Repository registry for managing all database repositories
 */
export class RepositoryRegistry {
  private userRepository?: UserRepository;
  private sessionRepository?: SessionRepository;
  private auditLogRepository?: AuditLogRepository;

  constructor(private databaseService: DatabaseService) {}

  /**
   * Get user repository
   */
  getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.databaseService);
    }
    return this.userRepository;
  }

  /**
   * Get session repository
   */
  getSessionRepository(): SessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new SessionRepository(this.databaseService);
    }
    return this.sessionRepository;
  }

  /**
   * Get audit log repository
   */
  getAuditLogRepository(): AuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new AuditLogRepository(this.databaseService);
    }
    return this.auditLogRepository;
  }

  /**
   * Get all repositories
   */
  getAllRepositories() {
    return {
      users: this.getUserRepository(),
      sessions: this.getSessionRepository(),
      auditLogs: this.getAuditLogRepository(),
    };
  }

  /**
   * Initialize all repositories (run any setup needed)
   */
  async initialize(): Promise<void> {
    // Initialize repositories if needed
    // For now, repositories don't need initialization
  }

  /**
   * Health check for all repositories
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    repositories: Record<string, { status: string; error?: string }>;
  }> {
    const repositories = this.getAllRepositories();
    const results: Record<string, { status: string; error?: string }> = {};

    // Test each repository with a simple query
    for (const [name, repo] of Object.entries(repositories)) {
      try {
        await repo.count();
        results[name] = { status: "healthy" };
      } catch (error) {
        results[name] = {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Determine overall status
    const statuses = Object.values(results).map((r) => r.status);
    const unhealthyCount = statuses.filter((s) => s === "unhealthy").length;

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (unhealthyCount === 0) {
      overallStatus = "healthy";
    } else if (unhealthyCount < statuses.length) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    return {
      status: overallStatus,
      repositories: results,
    };
  }
}
