import type { BaseRecord, UserRecord } from "../../../../types/database";
import { BaseRepository } from "./base-repository";

/**
 * User repository with user-specific operations and validation
 */
export class UserRepository extends BaseRepository<UserRecord> {
  protected tableName = "users";

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  /**
   * Validate user data before create/update
   */
  private validateUserData(data: Partial<UserRecord>): void {
    // Validate email if provided
    if (data.email) {
      this.validateEmail(data.email);
    }

    // Validate required fields for create
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new Error("Name is required");
    }

    // Validate role
    if (data.role && !["USER", "ADMIN", "MODERATOR"].includes(data.role)) {
      throw new Error(`Invalid role: ${data.role}`);
    }

    // Validate provider
    if (data.provider && !["email", "google", "github"].includes(data.provider)) {
      throw new Error(`Invalid provider: ${data.provider}`);
    }

    // Validate status
    if (data.status && !["active", "inactive", "suspended"].includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }
  }

  /**
   * Create user with validation
   */
  override async create(data: Omit<UserRecord, keyof BaseRecord>): Promise<UserRecord> {
    // Validate required fields
    if (!data.email) {
      throw new Error("Email is required");
    }
    if (!data.name) {
      throw new Error("Name is required");
    }

    // Validate data
    this.validateUserData(data);

    // Check for duplicate email
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error("UNIQUE constraint failed: users.email");
    }

    return super.create(data);
  }

  /**
   * Update user with validation
   */
  override async update(
    id: string,
    data: Partial<Omit<UserRecord, keyof BaseRecord>>
  ): Promise<UserRecord> {
    // Validate data
    this.validateUserData(data);

    // Check for duplicate email if email is being updated
    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("UNIQUE constraint failed: users.email");
      }
    }

    return super.update(id, data);
  }

  /**
   * Find user by email with validation
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    this.validateEmail(email);

    return this.findOneBy("email", email);
  }

  /**
   * Find users by status
   */
  async findByStatus(status: UserRecord["status"]): Promise<UserRecord[]> {
    return this.findBy("status", status);
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<UserRecord[]> {
    return this.findByStatus("active");
  }

  /**
   * Update user last login
   */
  async updateLastLogin(userId: string): Promise<UserRecord> {
    return this.update(userId, {
      last_login_at: new Date().toISOString(),
    });
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: UserRecord["status"]): Promise<UserRecord> {
    return this.update(userId, { status });
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "suspended");
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "active");
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "inactive");
  }

  /**
   * Update user metadata
   */
  async updateMetadata(userId: string, metadata: Record<string, unknown>): Promise<UserRecord> {
    return this.update(userId, {
      metadata: JSON.stringify(metadata),
    });
  }

  /**
   * Get user metadata
   */
  async getMetadata(userId: string): Promise<Record<string, unknown> | null> {
    const user = await this.findById(userId);
    if (!user?.metadata) {
      return null;
    }

    try {
      return JSON.parse(user.metadata);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit = 10): Promise<UserRecord[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName} 
       WHERE (LOWER(name) LIKE ? OR LOWER(email) LIKE ?) 
       AND status = 'active'
       ORDER BY name ASC 
       LIMIT ?`,
      [searchQuery, searchQuery, limit]
    );
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    verified: number;
    unverified: number;
  }> {
    const stats = await this.raw<{
      status: string;
      verified_email: boolean;
      count: number;
    }>(
      `SELECT 
         status,
         verified_email,
         COUNT(*) as count
       FROM ${this.tableName}
       GROUP BY status, verified_email`
    );

    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      verified: 0,
      unverified: 0,
    };

    for (const stat of stats) {
      result.total += stat.count;

      // Count by status
      if (stat.status === "active") {
        result.active += stat.count;
      } else if (stat.status === "inactive") {
        result.inactive += stat.count;
      } else if (stat.status === "suspended") {
        result.suspended += stat.count;
      }

      // Count by verification
      if (stat.verified_email) {
        result.verified += stat.count;
      } else {
        result.unverified += stat.count;
      }
    }

    return result;
  }

  /**
   * Get recently registered users
   */
  async getRecentUsers(days = 7, limit = 10): Promise<UserRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE created_at >= ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [cutoffDate.toISOString(), limit]
    );
  }

  /**
   * Get users who haven't logged in recently
   */
  async getInactiveUsers(days = 30, limit = 10): Promise<UserRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE (last_login_at IS NULL OR last_login_at < ?)
       AND status = 'active'
       ORDER BY created_at ASC
       LIMIT ?`,
      [cutoffDate.toISOString(), limit]
    );
  }

  /**
   * Bulk update user status
   */
  async bulkUpdateStatus(userIds: string[], status: UserRecord["status"]): Promise<number> {
    if (userIds.length === 0) {
      return 0;
    }

    const placeholders = userIds.map(() => "?").join(", ");
    const result = await this.db.execute(
      `UPDATE ${this.tableName} 
       SET status = ?, updated_at = datetime('now')
       WHERE id IN (${placeholders})`,
      [status, ...userIds]
    );

    return result.meta?.changes || 0;
  }

  /**
   * Delete users older than specified days (hard delete)
   */
  async deleteOldUsers(days = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.db.execute(
      `DELETE FROM ${this.tableName}
       WHERE created_at < ? AND status = 'inactive'`,
      [cutoffDate.toISOString()]
    );

    return result.meta?.changes || 0;
  }
}
