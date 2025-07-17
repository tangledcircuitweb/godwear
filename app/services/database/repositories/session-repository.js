import { BaseRepository } from "./base-repository";
/**
 * Session repository for user session management
 */
export class SessionRepository extends BaseRepository {
  tableName = "sessions";
  /**
   * Find session by token hash
   */
  findByTokenHash(tokenHash) {
    return this.findOneBy("token_hash", tokenHash);
  }
  /**
   * Find active sessions for user
   */
  findActiveSessionsForUser(userId) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = ? AND is_active = TRUE AND expires_at > datetime('now')
       ORDER BY created_at DESC`,
      [userId]
    );
  }
  /**
   * Find all sessions for user (active and inactive)
   */
  findAllSessionsForUser(userId) {
    return this.findBy("user_id", userId);
  }
  /**
   * Create new session
   */
  createSession(data) {
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
  deactivateSession(sessionId) {
    return this.update(sessionId, { is_active: false });
  }
  /**
   * Deactivate session by token hash
   */
  async deactivateSessionByToken(tokenHash) {
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
  async deactivateAllUserSessions(userId) {
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
  extendSession(sessionId, newExpiresAt) {
    return this.update(sessionId, { expires_at: newExpiresAt });
  }
  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await this.db.execute(`DELETE FROM ${this.tableName}
       WHERE expires_at < datetime('now') OR is_active = FALSE`);
    return result.meta?.changes || 0;
  }
  /**
   * Get session statistics
   */
  async getSessionStats() {
    const stats = await this.rawOne(`SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_active = TRUE AND expires_at > datetime('now') THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired,
         SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
       FROM ${this.tableName}`);
    return stats || { total: 0, active: 0, expired: 0, inactive: 0 };
  }
  /**
   * Get active sessions count by user
   */
  async getActiveSessionCountByUser(userId) {
    const result = await this.rawOne(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE user_id = ? AND is_active = TRUE AND expires_at > datetime('now')`,
      [userId]
    );
    return result?.count || 0;
  }
  /**
   * Get recent sessions for user
   */
  getRecentSessionsForUser(userId, limit = 10) {
    return this.raw(
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
  findSessionsByIP(ipAddress) {
    return this.findBy("ip_address", ipAddress);
  }
  /**
   * Get sessions created in date range
   */
  getSessionsInDateRange(startDate, endDate) {
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE created_at BETWEEN ? AND ?
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );
  }
  /**
   * Get concurrent sessions (sessions active at the same time)
   */
  getConcurrentSessions(userId) {
    return this.raw(
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
  async validateSession(tokenHash) {
    const session = await this.rawOne(
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
  async updateSessionActivity(sessionId) {
    // Use raw SQL since updated_at is not part of the updatable fields
    await this.db.execute(`UPDATE ${this.tableName} SET updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      sessionId,
    ]);
    const updated = await this.findById(sessionId);
    if (!updated) {
      throw new Error(`Session with id ${sessionId} not found after update`);
    }
    return updated;
  }
  /**
   * Get sessions that will expire soon
   */
  getExpiringSessions(hoursFromNow = 24) {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + hoursFromNow);
    return this.raw(
      `SELECT * FROM ${this.tableName}
       WHERE is_active = TRUE 
       AND expires_at > datetime('now')
       AND expires_at <= ?
       ORDER BY expires_at ASC`,
      [expiryTime.toISOString()]
    );
  }
}
//# sourceMappingURL=session-repository.js.map
