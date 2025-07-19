import { z } from "zod";
import { BaseRepository } from "./base-repository";

// Define the types that will be inferred from Zod schemas in the implementation file
export type AuditLogRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  old_values?: string | null;
  new_values?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
};
import { BaseRepository } from "./base-repository";
/**
 * Audit log repository for tracking system changes and user actions
 */
export declare class AuditLogRepository extends BaseRepository<AuditLogRecord> {
    protected tableName: string;
    /**
     * Create audit log entry
     */
    createAuditLog(data: {
        userId?: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLogRecord>;
    /**
     * Find audit logs for specific user
     */
    findByUser(userId: string, limit?: number): Promise<AuditLogRecord[]>;
    /**
     * Find audit logs for specific resource
     */
    findByResource(resourceType: string, resourceId: string): Promise<AuditLogRecord[]>;
    /**
     * Find audit logs by action type
     */
    findByAction(action: string, limit?: number): Promise<AuditLogRecord[]>;
    /**
     * Find audit logs in date range
     */
    findInDateRange(startDate: string, endDate: string): Promise<AuditLogRecord[]>;
    /**
     * Find audit logs by IP address
     */
    findByIPAddress(ipAddress: string): Promise<AuditLogRecord[]>;
    /**
     * Get audit log statistics
     */
    getAuditStats(): Promise<{
        totalLogs: number;
        uniqueUsers: number;
        uniqueActions: number;
        uniqueResources: number;
        logsByAction: Array<{
            action: string;
            count: number;
        }>;
        logsByResource: Array<{
            resource_type: string;
            count: number;
        }>;
    }>;
    /**
     * Get recent activity for dashboard
     */
    getRecentActivity(limit?: number): Promise<AuditLogRecord[]>;
    /**
     * Get user activity summary
     */
    getUserActivitySummary(userId: string, days?: number): Promise<{
        totalActions: number;
        actionsByType: Array<{
            action: string;
            count: number;
        }>;
        resourcesByType: Array<{
            resource_type: string;
            count: number;
        }>;
        dailyActivity: Array<{
            date: string;
            count: number;
        }>;
    }>;
    /**
     * Search audit logs
     */
    searchLogs(query: {
        userId?: string;
        action?: string;
        resourceType?: string;
        resourceId?: string;
        ipAddress?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<AuditLogRecord[]>;
    /**
     * Clean up old audit logs
     */
    cleanupOldLogs(daysToKeep?: number): Promise<number>;
    /**
     * Get security-related audit logs
     */
    getSecurityLogs(limit?: number): Promise<AuditLogRecord[]>;
    /**
     * Get failed login attempts
     */
    getFailedLoginAttempts(hours?: number): Promise<AuditLogRecord[]>;
    /**
     * Get suspicious activity patterns
     */
    getSuspiciousActivity(): Promise<{
        multipleFailedLogins: AuditLogRecord[];
        unusualIPActivity: Array<{
            ip_address: string;
            count: number;
            actions: string[];
        }>;
        rapidActions: AuditLogRecord[];
    }>;
}
//# sourceMappingURL=audit-log-repository.d.ts.map