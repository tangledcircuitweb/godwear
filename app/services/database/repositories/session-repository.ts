import type { SessionRecord } from "../../../../types/database";
import { BaseRepository } from "./base-repository";

/**
 * Session repository for user session management
 */
export class SessionRepository extends BaseRepository<SessionRecord> {
  protected tableName = "sessions";

  /**
   * Find session by token hash
   */
  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.findOneBy("token_hash", tokenHash);
  }

  /**
   * Find active sessions for user
   */
  async findActiveSessionsForUser(userId: string): Promise<SessionRecord[]> {
    return this.raw<SessionRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = ? AND is_active = TRUE AND expires_at > datetime('now')
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Find all sessions for user (active and inactive)
   */
  async findAllSessionsForUser(userId: string): Promise<SessionRecord[]> {
    return this.findBy("user_id", userId);
  }

  /**
   * Create new session
   */
  async createSession(data: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SessionRecord> {
    return this.create({
      user_id: data.userId,
      token_hash: data.tokenHash,
      expires_at: data.expiresAt,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      is_active: true,
    });
  }

  /**
   * Deactivate session
   */
  async deactivateSession(sessionId: string): Promise<SessionRecord> {
    return this.update(sessionId, { is_active: false });
  }

  /**
   * Deactivate session by token hash
   */
  async deactivateSessionByToken(tokenHash: string): Promise<boolean> {
    const result = await this.db.execute(
      `UPDATE ${this.tableName} 
       SET is_active = FALSE, updated_at = datetime('now')
       WHERE token_hash = ?`,
      [tokenHash]
    );

    return (result.meta?.changes || 0) > 0;
  }

  /**
   * Deactivate all sessions for user
   */
  async deactivateAllUserSessions(userId: string): Promise<number> {
    const result = await this.db.execute(
      `UPDATE ${this.tableName}
       SET is_active = FALSE, updated_at = datetime('now')
       WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );

    return result.meta?.changes || 0;
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, newExpiresAt: string): Promise<SessionRecord> {
    return this.update(sessionId, { expires_at: newExpiresAt });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.db.execute(
      `DELETE FROM ${this.tableName}
       WHERE expires_at < datetime('now') OR is_active = FALSE`,
    );

    return result.meta?.changes || 0;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    inactive: number;
  }> {
    const stats = await this.rawOne<{
      total: number;
      active: number;
      expired: number;
      inactive: number;
    }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_active = TRUE AND expires_at > datetime('now') THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired,
         SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
       FROM ${this.tableName}`
    );

    return stats || { total: 0, active: 0, expired: 0, inactive: 0 };
  }

  /**
   * Get active sessions count by user
   */
  async getActiveSessionCountByUser(userId: string): Promise<number> {
    const result = await this.rawOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE user_id = ? AND is_active = TRUE AND expires_at > datetime('now')`,
      [userId]
    );

    return result?.count || 0;
  }

  /**
   * Get recent sessions for user
   */
  async getRecentSessionsForUser(userId: string, limit = 10): Promise<SessionRecord[]> {
    return this.raw<SessionRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  }

  /**
   * Find sessions by IP address
   */
  async findSessionsByIP(ipAddress: string): Promise<SessionRecord[]> {
    return this.findBy("ip_address", ipAddress);
  }

  /**
   * Get sessions created in date range
   */
  async getSessionsInDateRange(startDate: string, endDate: string): Promise<SessionRecord[]> {
    return this.raw<SessionRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE created_at BETWEEN ? AND ?
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );
  }

  /**
   * Get concurrent sessions (sessions active at the same time)
   */
  async getConcurrentSessions(userId: string): Promise<SessionRecord[]> {
    return this.raw<SessionRecord>(
      `SELECT s1.* FROM ${this.tableName} s1
       WHERE s1.user_id = ? 
       AND s1.is_active = TRUE 
       AND s1.expires_at > datetime('now')
       AND EXISTS (
         SELECT 1 FROM ${this.tableName} s2
         WHERE s2.user_id = s1.user_id
         AND s2.id != s1.id
         AND s2.is_active = TRUE
         AND s2.expires_at > datetime('now')
         AND s2.created_at <= s1.expires_at
         AND s1.created_at <= s2.expires_at
       )
       ORDER BY s1.created_at DESC`,
      [userId]
    );
  }

  /**
   * Validate session token and return session if valid
   */
  async validateSession(tokenHash: string): Promise<SessionRecord | null> {
    const session = await this.rawOne<SessionRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE token_hash = ? 
       AND is_active = TRUE 
       AND expires_at > datetime('now')`,
      [tokenHash]
    );

    return session;
  }

  /**
   * Update session activity (last seen)
   */
  async updateSessionActivity(sessionId: string): Promise<SessionRecord> {
    // Use raw SQL since updated_at is not part of the updatable fields
    await this.db.execute(
      `UPDATE ${this.tableName} SET updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), sessionId]
    );

    const updated = await this.findById(sessionId);
    if (!updated) {
      throw new Error(`Session with id ${sessionId} not found after update`);
    }

    return updated;
  }

  /**
   * Get sessions that will expire soon
   */
  async getExpiringSessions(hoursFromNow = 24): Promise<SessionRecord[]> {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + hoursFromNow);

    return this.raw<SessionRecord>(
      `SELECT * FROM ${this.tableName}
       WHERE is_active = TRUE 
       AND expires_at > datetime('now')
       AND expires_at <= ?
       ORDER BY expires_at ASC`,
      [expiryTime.toISOString()]
    );
  }
}
