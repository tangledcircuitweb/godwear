import type { BaseRecord, UserRecord } from "../../../../types/database";
import { BaseRepository } from "./base-repository";
/**
 * User repository with user-specific operations and validation
 */
export declare class UserRepository extends BaseRepository<UserRecord> {
    protected tableName: string;
    /**
     * Validate email format
     */
    private validateEmail;
    /**
     * Validate user data before create/update
     */
    private validateUserData;
    /**
     * Create user with validation
     */
    create(data: Omit<UserRecord, keyof BaseRecord>): Promise<UserRecord>;
    /**
     * Update user with validation
     */
    update(id: string, data: Partial<Omit<UserRecord, keyof BaseRecord>>): Promise<UserRecord>;
    /**
     * Find user by email with validation
     */
    findByEmail(email: string): Promise<UserRecord | null>;
    /**
     * Find users by status
     */
    findByStatus(status: UserRecord["status"]): Promise<UserRecord[]>;
    /**
     * Find active users
     */
    findActiveUsers(): Promise<UserRecord[]>;
    /**
     * Update user last login
     */
    updateLastLogin(userId: string): Promise<UserRecord>;
    /**
     * Update user status
     */
    updateStatus(userId: string, status: UserRecord["status"]): Promise<UserRecord>;
    /**
     * Suspend user
     */
    suspendUser(userId: string): Promise<UserRecord>;
    /**
     * Activate user
     */
    activateUser(userId: string): Promise<UserRecord>;
    /**
     * Deactivate user
     */
    deactivateUser(userId: string): Promise<UserRecord>;
    /**
     * Update user metadata
     */
    updateMetadata(userId: string, metadata: Record<string, unknown>): Promise<UserRecord>;
    /**
     * Get user metadata
     */
    getMetadata(userId: string): Promise<Record<string, unknown> | null>;
    /**
     * Search users by name or email
     */
    searchUsers(query: string, limit?: number): Promise<UserRecord[]>;
    /**
     * Get user statistics
     */
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
        verified: number;
        unverified: number;
    }>;
    /**
     * Get recently registered users
     */
    getRecentUsers(days?: number, limit?: number): Promise<UserRecord[]>;
    /**
     * Get users who haven't logged in recently
     */
    getInactiveUsers(days?: number, limit?: number): Promise<UserRecord[]>;
    /**
     * Bulk update user status
     */
    bulkUpdateStatus(userIds: string[], status: UserRecord["status"]): Promise<number>;
    /**
     * Delete users older than specified days (hard delete)
     */
    deleteOldUsers(days?: number): Promise<number>;
}
//# sourceMappingURL=user-repository.d.ts.map