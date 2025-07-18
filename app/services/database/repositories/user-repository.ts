import { z } from "zod";
import { BaseRepository } from "./base-repository";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Base record schema (imported from BaseRepository)
 */
const BaseRecordSchema = BaseRepository.BaseRecordSchema;

/**
 * User record schema
 */
const UserRecordSchema = BaseRecordSchema.extend({
  email: z.string().email(),
  name: z.string().min(1),
  picture: z.string().nullable().optional(),
  verified_email: z.boolean(),
  last_login_at: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]),
  provider: z.enum(["email", "google", "github"]),
  metadata: z.string().nullable().optional(), // JSON string
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type BaseRecord = z.infer<typeof BaseRecordSchema>;
type UserRecord = z.infer<typeof UserRecordSchema>;

/**
 * User repository with user-specific operations and validation
 */
export class UserRepository extends BaseRepository<UserRecord> {
  protected tableName = "users";

  // Export schemas for use in other files
  static readonly UserRecordSchema = UserRecordSchema;

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  /**
   * Validate user data before create/update
   */
  private validateUserData(data: Partial<UserRecord>): void {
    // Create a partial schema for validation
    const partialUserSchema = UserRecordSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
    }).partial();

    const result = partialUserSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.format();
      const errorMessage = Object.entries(errors)
        .filter(([key]) => key !== '_errors')
        .map(([key, value]) => `${key}: ${value._errors.join(', ')}`)
        .join('; ');
      
      throw new Error(`Invalid user data: ${errorMessage}`);
    }
  }
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
  findByEmail(email: string): Promise<UserRecord | null> {
    this.validateEmail(email);

    return this.findOneBy("email", email);
  }

  /**
   * Find users by status
   */
  findByStatus(status: UserRecord["status"]): Promise<UserRecord[]> {
    return this.findBy("status", status);
  }

  /**
   * Find active users
   */
  findActiveUsers(): Promise<UserRecord[]> {
    return this.findByStatus("active");
  }

  /**
   * Update user last login
   */
  updateLastLogin(userId: string): Promise<UserRecord> {
    return this.update(userId, {
      last_login_at: new Date().toISOString(),
    });
  }

  /**
   * Update user status
   */
  updateStatus(userId: string, status: UserRecord["status"]): Promise<UserRecord> {
    return this.update(userId, { status });
  }

  /**
   * Suspend user
   */
  suspendUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "suspended");
  }

  /**
   * Activate user
   */
  activateUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "active");
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string): Promise<UserRecord> {
    return this.updateStatus(userId, "inactive");
  }

  /**
   * Update user metadata
   */
  updateMetadata(userId: string, metadata: Record<string, unknown>): Promise<UserRecord> {
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
  searchUsers(query: string, limit = 10): Promise<UserRecord[]> {
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
  getRecentUsers(days = 7, limit = 10): Promise<UserRecord[]> {
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
  getInactiveUsers(days = 30, limit = 10): Promise<UserRecord[]> {
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
