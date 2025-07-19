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
        .map(([key, value]) => {
          const errObj = value as { _errors: string[] };
          return `${key}: ${errObj._errors?.join(', ') || 'Invalid value'}`;
        })
        .join('; ');
      
      throw new Error(`Invalid user data: ${errorMessage}`);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.findOneBy("email", email);
  }

  /**
   * Find user by provider ID
   */
  async findByProviderId(provider: string, providerId: string): Promise<UserRecord | null> {
    return this.findOne({
      where: [
        { column: "provider", operator: "=", value: provider },
        { column: "provider_id", operator: "=", value: providerId },
      ],
    });
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<UserRecord[]> {
    return this.findBy("status", "active");
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<UserRecord[]> {
    return this.findBy("role", role);
  }

  /**
   * Find users by status
   */
  async findByStatus(status: string): Promise<UserRecord[]> {
    return this.findBy("status", status);
  }

  /**
   * Find users by provider
   */
  async findByProvider(provider: string): Promise<UserRecord[]> {
    return this.findBy("provider", provider);
  }

  /**
   * Find users by verified email status
   */
  async findByVerifiedEmail(verified: boolean): Promise<UserRecord[]> {
    return this.findBy("verified_email", verified);
  }

  /**
   * Create new user with validation
   */
  override async create(data: Omit<UserRecord, keyof BaseRecord>): Promise<UserRecord> {
    this.validateUserData(data);
    return super.create(data);
  }

  /**
   * Update user with validation
   */
  override async update(
    id: string,
    data: Partial<Omit<UserRecord, keyof BaseRecord>>
  ): Promise<UserRecord> {
    this.validateUserData(data);
    return super.update(id, data);
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserRecord[]> {
    const searchTerm = `%${query}%`;
    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY name ASC
       LIMIT 50`,
      [searchTerm, searchTerm]
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
    byProvider: Record<string, number>;
    byRole: Record<string, number>;
  }> {
    const total = await this.count();
    const active = await this.count({ where: [{ column: "status", operator: "=", value: "active" }] });
    const inactive = await this.count({ where: [{ column: "status", operator: "=", value: "inactive" }] });
    const suspended = await this.count({ where: [{ column: "status", operator: "=", value: "suspended" }] });

    // Get counts by provider
    const providers = ["email", "google", "github"];
    const byProvider: Record<string, number> = {};
    for (const provider of providers) {
      byProvider[provider] = await this.count({
        where: [{ column: "provider", operator: "=", value: provider }],
      });
    }

    // Get counts by role
    const roles = ["USER", "ADMIN", "MODERATOR"];
    const byRole: Record<string, number> = {};
    for (const role of roles) {
      byRole[role] = await this.count({
        where: [{ column: "role", operator: "=", value: role }],
      });
    }

    return {
      total,
      active,
      inactive,
      suspended,
      byProvider,
      byRole,
    };
  }

  /**
   * Find recently active users
   */
  async findRecentlyActiveUsers(days = 7): Promise<UserRecord[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const cutoffDate = date.toISOString();

    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE last_login_at >= ?
       ORDER BY last_login_at DESC
       LIMIT 50`,
      [cutoffDate]
    );
  }

  /**
   * Find inactive users
   */
  async findInactiveUsers(days = 30): Promise<UserRecord[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const cutoffDate = date.toISOString();

    return this.raw<UserRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE (last_login_at < ? OR last_login_at IS NULL)
       AND status = 'active'
       ORDER BY last_login_at ASC NULLS FIRST
       LIMIT 50`,
      [cutoffDate]
    );
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: "active" | "inactive" | "suspended"): Promise<UserRecord> {
    return this.update(userId, { status });
  }
}

// Export types for use in other files
export type { UserRecord };

