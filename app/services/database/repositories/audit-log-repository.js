import { BaseRepository } from "./base-repository";
/**
 * Audit log repository for tracking system changes and user actions
 */
export class AuditLogRepository extends BaseRepository {
  tableName = "audit_logs";
  /**
   * Create audit log entry
   */
  async createAuditLog(data) {
    return this.create({
      user_id: data.userId || null,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId || null,
      old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
      new_values: data.newValues ? JSON.stringify(data.newValues) : null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
    });
  }
  /**
   * Find audit logs for specific user
   */
  async findByUser(userId, limit = 50) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  }
  /**
   * Find audit logs for specific resource
   */
  async findByResource(resourceType, resourceId) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE resource_type = ? AND resource_id = ?
       ORDER BY created_at DESC`,
      [resourceType, resourceId]
    );
  }
  /**
   * Find audit logs by action type
   */
  async findByAction(action, limit = 100) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE action = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [action, limit]
    );
  }
  /**
   * Find audit logs in date range
   */
  async findInDateRange(startDate, endDate) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE created_at BETWEEN ? AND ?
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );
  }
  /**
   * Find audit logs by IP address
   */
  async findByIPAddress(ipAddress) {
    return this.findBy("ip_address", ipAddress);
  }
  /**
   * Get audit log statistics
   */
  async getAuditStats() {
    const [totalResult, uniqueUsersResult, actionStatsResult, resourceStatsResult] =
      await Promise.all([
        this.rawOne(`SELECT COUNT(*) as count FROM ${this.tableName}`),
        this.rawOne(
          `SELECT COUNT(DISTINCT user_id) as count FROM ${this.tableName} WHERE user_id IS NOT NULL`
        ),
        this.raw(
          `SELECT action, COUNT(*) as count FROM ${this.tableName} GROUP BY action ORDER BY count DESC`
        ),
        this.raw(
          `SELECT resource_type, COUNT(*) as count FROM ${this.tableName} GROUP BY resource_type ORDER BY count DESC`
        ),
      ]);
    return {
      totalLogs: totalResult?.count || 0,
      uniqueUsers: uniqueUsersResult?.count || 0,
      uniqueActions: actionStatsResult.length,
      uniqueResources: resourceStatsResult.length,
      logsByAction: actionStatsResult,
      logsByResource: resourceStatsResult,
    };
  }
  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit = 20) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
  }
  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const [totalResult, actionStatsResult, resourceStatsResult, dailyActivityResult] =
      await Promise.all([
        this.rawOne(
          `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ? AND created_at >= ?`,
          [userId, cutoffDate.toISOString()]
        ),
        this.raw(
          `SELECT action, COUNT(*) as count FROM ${this.tableName} 
         WHERE user_id = ? AND created_at >= ?
         GROUP BY action ORDER BY count DESC`,
          [userId, cutoffDate.toISOString()]
        ),
        this.raw(
          `SELECT resource_type, COUNT(*) as count FROM ${this.tableName}
         WHERE user_id = ? AND created_at >= ?
         GROUP BY resource_type ORDER BY count DESC`,
          [userId, cutoffDate.toISOString()]
        ),
        this.raw(
          `SELECT DATE(created_at) as date, COUNT(*) as count FROM ${this.tableName}
         WHERE user_id = ? AND created_at >= ?
         GROUP BY DATE(created_at) ORDER BY date DESC`,
          [userId, cutoffDate.toISOString()]
        ),
      ]);
    return {
      totalActions: totalResult?.count || 0,
      actionsByType: actionStatsResult,
      resourcesByType: resourceStatsResult,
      dailyActivity: dailyActivityResult,
    };
  }
  /**
   * Search audit logs
   */
  async searchLogs(query) {
    const conditions = [];
    const params = [];
    if (query.userId) {
      conditions.push("user_id = ?");
      params.push(query.userId);
    }
    if (query.action) {
      conditions.push("action LIKE ?");
      params.push(`%${query.action}%`);
    }
    if (query.resourceType) {
      conditions.push("resource_type = ?");
      params.push(query.resourceType);
    }
    if (query.resourceId) {
      conditions.push("resource_id = ?");
      params.push(query.resourceId);
    }
    if (query.ipAddress) {
      conditions.push("ip_address = ?");
      params.push(query.ipAddress);
    }
    if (query.startDate) {
      conditions.push("created_at >= ?");
      params.push(query.startDate);
    }
    if (query.endDate) {
      conditions.push("created_at <= ?");
      params.push(query.endDate);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = query.limit || 100;
    return this.raw(
      `SELECT * FROM ${this.tableName}
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ?`,
      [...params, limit]
    );
  }
  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const result = await this.db.execute(
      `DELETE FROM ${this.tableName}
       WHERE created_at < ?`,
      [cutoffDate.toISOString()]
    );
    return result.meta?.changes || 0;
  }
  /**
   * Get security-related audit logs
   */
  async getSecurityLogs(limit = 100) {
    const securityActions = [
      "login",
      "logout",
      "login_failed",
      "password_change",
      "email_change",
      "account_locked",
      "account_unlocked",
      "permission_change",
      "role_change",
      "suspicious_activity",
    ];
    const placeholders = securityActions.map(() => "?").join(", ");
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE action IN (${placeholders})
       ORDER BY created_at DESC
       LIMIT ?`,
      [...securityActions, limit]
    );
  }
  /**
   * Get failed login attempts
   */
  async getFailedLoginAttempts(hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE action = 'login_failed'
       AND created_at >= ?
       ORDER BY created_at DESC`,
      [cutoffDate.toISOString()]
    );
  }
  /**
   * Get suspicious activity patterns
   */
  async getSuspiciousActivity() {
    // Multiple failed logins from same IP in last hour
    const multipleFailedLogins = await this.raw(`SELECT * FROM ${this.tableName}
       WHERE action = 'login_failed'
       AND created_at >= datetime('now', '-1 hour')
       AND ip_address IN (
         SELECT ip_address FROM ${this.tableName}
         WHERE action = 'login_failed'
         AND created_at >= datetime('now', '-1 hour')
         GROUP BY ip_address
         HAVING COUNT(*) >= 5
       )
       ORDER BY created_at DESC`);
    // Unusual IP activity (many different actions from same IP)
    const unusualIPActivity = await this.raw(`SELECT 
         ip_address,
         COUNT(*) as count,
         GROUP_CONCAT(DISTINCT action) as actions
       FROM ${this.tableName}
       WHERE created_at >= datetime('now', '-24 hours')
       AND ip_address IS NOT NULL
       GROUP BY ip_address
       HAVING COUNT(DISTINCT action) >= 5 AND COUNT(*) >= 20
       ORDER BY count DESC`).then((results) =>
      results.map((r) => ({
        ip_address: r.ip_address,
        count: r.count,
        actions: r.actions.split(","),
      }))
    );
    // Rapid actions (many actions in short time from same user)
    const rapidActions = await this.raw(`SELECT * FROM ${this.tableName}
       WHERE created_at >= datetime('now', '-1 hour')
       AND user_id IN (
         SELECT user_id FROM ${this.tableName}
         WHERE created_at >= datetime('now', '-1 hour')
         AND user_id IS NOT NULL
         GROUP BY user_id
         HAVING COUNT(*) >= 50
       )
       ORDER BY created_at DESC`);
    return {
      multipleFailedLogins,
      unusualIPActivity,
      rapidActions,
    };
  }
}
//# sourceMappingURL=audit-log-repository.js.map
