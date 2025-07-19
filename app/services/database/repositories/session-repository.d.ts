import { z } from "zod";
import { BaseRepository } from "./base-repository";

// Define the types that will be inferred from Zod schemas in the implementation file
export type SessionRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_active: boolean;
};
import { BaseRepository } from "./base-repository";
/**
 * Session repository for user session management
 */
export declare class SessionRepository extends BaseRepository<SessionRecord> {
    protected tableName: string;
    /**
     * Find session by token hash
     */
    findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
    /**
     * Find active sessions for user
     */
    findActiveSessionsForUser(userId: string): Promise<SessionRecord[]>;
    /**
     * Find all sessions for user (active and inactive)
     */
    findAllSessionsForUser(userId: string): Promise<SessionRecord[]>;
    /**
     * Create new session
     */
    createSession(data: {
        userId: string;
        tokenHash: string;
        expiresAt: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<SessionRecord>;
    /**
     * Deactivate session
     */
    deactivateSession(sessionId: string): Promise<SessionRecord>;
    /**
     * Deactivate session by token hash
     */
    deactivateSessionByToken(tokenHash: string): Promise<boolean>;
    /**
     * Deactivate all sessions for user
     */
    deactivateAllUserSessions(userId: string): Promise<number>;
    /**
     * Extend session expiration
     */
    extendSession(sessionId: string, newExpiresAt: string): Promise<SessionRecord>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Get session statistics
     */
    getSessionStats(): Promise<{
        total: number;
        active: number;
        expired: number;
        inactive: number;
    }>;
    /**
     * Get active sessions count by user
     */
    getActiveSessionCountByUser(userId: string): Promise<number>;
    /**
     * Get recent sessions for user
     */
    getRecentSessionsForUser(userId: string, limit?: number): Promise<SessionRecord[]>;
    /**
     * Find sessions by IP address
     */
    findSessionsByIP(ipAddress: string): Promise<SessionRecord[]>;
    /**
     * Get sessions created in date range
     */
    getSessionsInDateRange(startDate: string, endDate: string): Promise<SessionRecord[]>;
    /**
     * Get concurrent sessions (sessions active at the same time)
     */
    getConcurrentSessions(userId: string): Promise<SessionRecord[]>;
    /**
     * Validate session token and return session if valid
     */
    validateSession(tokenHash: string): Promise<SessionRecord | null>;
    /**
     * Update session activity (last seen)
     */
    updateSessionActivity(sessionId: string): Promise<SessionRecord>;
    /**
     * Get sessions that will expire soon
     */
    getExpiringSessions(hoursFromNow?: number): Promise<SessionRecord[]>;
}
//# sourceMappingURL=session-repository.d.ts.map