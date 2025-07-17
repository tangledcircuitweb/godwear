/**
 * Comprehensive database service for D1 integration
 */
export class D1DatabaseService {
  serviceName = "database-service";
  env;
  logger;
  config;
  metrics;
  constructor(config) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      queryTimeout: 30000,
      enableQueryLogging: true,
      enableMetrics: true,
      ...config,
    };
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
    };
  }
  initialize(dependencies) {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
  }
  /**
   * Get database connection
   */
  getConnection() {
    if (!this.env.DB) {
      throw new Error("Database not configured");
    }
    return this.env.DB;
  }
  /**
   * Execute a query with retry logic and metrics
   */
  async query(sql, params) {
    const startTime = Date.now();
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.metrics.totalQueries++;
        if (this.config.enableQueryLogging) {
          this.logger?.debug("Executing query", { sql, params, attempt });
        }
        const db = this.getConnection();
        const stmt = params ? db.prepare(sql).bind(...params) : db.prepare(sql);
        const result = await stmt.all();
        const duration = Date.now() - startTime;
        this.updateMetrics(true, duration);
        if (duration > 5000) {
          this.metrics.slowQueries++;
          this.logger?.warn("Slow query detected", { sql, duration, params });
        }
        return {
          results: result.results,
          success: result.success,
          meta: {
            duration,
            rows_read: result.meta.rows_read || 0,
            rows_written: result.meta.rows_written || 0,
          },
        };
      } catch (error) {
        lastError = error;
        this.logger?.error(`Query attempt ${attempt} failed`, error, { sql, params });
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    const duration = Date.now() - startTime;
    this.updateMetrics(false, duration);
    this.metrics.lastError = lastError?.message || "Unknown error";
    this.metrics.lastErrorTime = new Date().toISOString();
    throw new Error(`Query failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }
  /**
   * Execute a query expecting a single result
   */
  async queryOne(sql, params) {
    const startTime = Date.now();
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.metrics.totalQueries++;
        if (this.config.enableQueryLogging) {
          this.logger?.debug("Executing single query", { sql, params, attempt });
        }
        const db = this.getConnection();
        const stmt = params ? db.prepare(sql).bind(...params) : db.prepare(sql);
        const result = await stmt.first();
        const duration = Date.now() - startTime;
        this.updateMetrics(true, duration);
        if (duration > 5000) {
          this.metrics.slowQueries++;
          this.logger?.warn("Slow query detected", { sql, duration, params });
        }
        return {
          result: result,
          success: true,
          meta: {
            duration,
            rows_read: 1,
            rows_written: 0,
          },
        };
      } catch (error) {
        lastError = error;
        this.logger?.error(`Single query attempt ${attempt} failed`, error, {
          sql,
          params,
        });
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    const duration = Date.now() - startTime;
    this.updateMetrics(false, duration);
    this.metrics.lastError = lastError?.message || "Unknown error";
    this.metrics.lastErrorTime = new Date().toISOString();
    throw new Error(
      `Single query failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }
  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async execute(sql, params) {
    const startTime = Date.now();
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.metrics.totalQueries++;
        if (this.config.enableQueryLogging) {
          this.logger?.debug("Executing statement", { sql, params, attempt });
        }
        const db = this.getConnection();
        const stmt = params ? db.prepare(sql).bind(...params) : db.prepare(sql);
        const result = await stmt.run();
        const duration = Date.now() - startTime;
        this.updateMetrics(true, duration);
        return result;
      } catch (error) {
        lastError = error;
        this.logger?.error(`Execute attempt ${attempt} failed`, error, { sql, params });
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    const duration = Date.now() - startTime;
    this.updateMetrics(false, duration);
    this.metrics.lastError = lastError?.message || "Unknown error";
    this.metrics.lastErrorTime = new Date().toISOString();
    throw new Error(
      `Execute failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }
  /**
   * Execute multiple statements in a batch
   */
  async batch(statements) {
    const startTime = Date.now();
    try {
      this.metrics.totalQueries++;
      if (this.config.enableQueryLogging) {
        this.logger?.debug("Executing batch", { statementCount: statements.length });
      }
      const db = this.getConnection();
      const results = await db.batch(statements);
      const duration = Date.now() - startTime;
      this.updateMetrics(true, duration);
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);
      this.metrics.lastError = error.message;
      this.metrics.lastErrorTime = new Date().toISOString();
      this.logger?.error("Batch execution failed", error);
      throw error;
    }
  }
  /**
   * Execute operations in a transaction
   */
  async transaction(callback) {
    const db = this.getConnection();
    // D1 doesn't have explicit transactions, but we can simulate with batch operations
    // For now, we'll pass the database connection as the transaction
    const tx = {
      prepare: (query) => db.prepare(query),
      batch: (statements) => db.batch(statements),
      exec: (query) => db.exec(query),
    };
    try {
      return await callback(tx);
    } catch (error) {
      this.logger?.error("Transaction failed", error);
      throw error;
    }
  }
  /**
   * Build WHERE clause from conditions
   */
  buildWhereClause(conditions) {
    if (conditions.length === 0) {
      return { clause: "", params: [] };
    }
    const clauses = [];
    const params = [];
    for (const condition of conditions) {
      switch (condition.operator) {
        case "IS NULL":
        case "IS NOT NULL":
          clauses.push(`${condition.column} ${condition.operator}`);
          break;
        case "IN":
        case "NOT IN":
          if (Array.isArray(condition.value)) {
            const placeholders = condition.value.map(() => "?").join(", ");
            clauses.push(`${condition.column} ${condition.operator} (${placeholders})`);
            params.push(...condition.value);
          }
          break;
        default:
          clauses.push(`${condition.column} ${condition.operator} ?`);
          params.push(condition.value);
      }
    }
    return {
      clause: `WHERE ${clauses.join(" AND ")}`,
      params,
    };
  }
  /**
   * Build ORDER BY clause
   */
  buildOrderByClause(orderBy) {
    if (!orderBy || orderBy.length === 0) {
      return "";
    }
    const clauses = orderBy.map(({ column, direction }) => `${column} ${direction}`);
    return `ORDER BY ${clauses.join(", ")}`;
  }
  /**
   * Build LIMIT and OFFSET clause
   */
  buildLimitClause(limit, offset) {
    const clauses = [];
    if (limit !== undefined) {
      clauses.push(`LIMIT ${limit}`);
    }
    if (offset !== undefined) {
      clauses.push(`OFFSET ${offset}`);
    }
    return clauses.join(" ");
  }
  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      // Ensure migrations table exists
      await this.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          migration_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at TEXT NOT NULL DEFAULT (datetime('now')),
          checksum TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      // Get pending migrations
      const migrations = await this.getPendingMigrations();
      for (const migration of migrations) {
        await this.runMigration(migration);
      }
      this.logger?.info("Migrations completed", { count: migrations.length });
    } catch (error) {
      this.logger?.error("Migration failed", error);
      throw error;
    }
  }
  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    // This would typically load from a migrations directory
    // For now, return the initial schema migration
    const allMigrations = [
      {
        id: "001",
        name: "initial_schema",
        created_at: new Date().toISOString(),
        up: `
          -- Users table
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            picture TEXT,
            verified_email BOOLEAN NOT NULL DEFAULT FALSE,
            last_login_at TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            metadata TEXT, -- JSON string
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          -- Sessions table
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- Audit logs table
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            old_values TEXT, -- JSON string
            new_values TEXT, -- JSON string
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          );

          -- Configuration table
          CREATE TABLE IF NOT EXISTS config (
            id TEXT PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            description TEXT,
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            category TEXT NOT NULL DEFAULT 'general',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          -- Indexes
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
          CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
          CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
          CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
          CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);
          CREATE INDEX IF NOT EXISTS idx_config_category ON config(category);
        `,
        down: `
          DROP INDEX IF EXISTS idx_config_category;
          DROP INDEX IF EXISTS idx_config_key;
          DROP INDEX IF EXISTS idx_audit_logs_created_at;
          DROP INDEX IF EXISTS idx_audit_logs_resource;
          DROP INDEX IF EXISTS idx_audit_logs_user_id;
          DROP INDEX IF EXISTS idx_sessions_expires_at;
          DROP INDEX IF EXISTS idx_sessions_token_hash;
          DROP INDEX IF EXISTS idx_sessions_user_id;
          DROP INDEX IF EXISTS idx_users_status;
          DROP INDEX IF EXISTS idx_users_email;
          DROP TABLE IF EXISTS config;
          DROP TABLE IF EXISTS audit_logs;
          DROP TABLE IF EXISTS sessions;
          DROP TABLE IF EXISTS users;
        `,
      },
    ];
    // Get executed migrations
    const executedResult = await this.query(
      "SELECT migration_id FROM migrations ORDER BY executed_at"
    );
    const executedIds = new Set(executedResult.results.map((m) => m.migration_id));
    return allMigrations.filter((migration) => !executedIds.has(migration.id));
  }
  /**
   * Run a single migration
   */
  async runMigration(migration) {
    try {
      // Execute migration
      await this.execute(migration.up);
      // Record migration
      await this.execute(
        `INSERT INTO migrations (id, migration_id, name, checksum) 
         VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), migration.id, migration.name, this.calculateChecksum(migration.up)]
      );
      this.logger?.info("Migration executed", { id: migration.id, name: migration.name });
    } catch (error) {
      this.logger?.error("Migration execution failed", error, {
        id: migration.id,
        name: migration.name,
      });
      throw error;
    }
  }
  /**
   * Calculate checksum for migration
   */
  calculateChecksum(content) {
    // Simple hash function for migration content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  /**
   * Rollback a migration
   */
  rollbackMigration(_migrationId) {
    // Implementation would load and execute the down migration
    throw new Error("Migration rollback not implemented");
  }
  /**
   * Get migration status
   */
  async getMigrationStatus() {
    const result = await this.query("SELECT * FROM migrations ORDER BY executed_at DESC");
    return result.results;
  }
  /**
   * Get table schema
   */
  getTableSchema(_tableName) {
    // Implementation would query SQLite schema tables
    throw new Error("Schema introspection not implemented");
  }
  /**
   * Validate database schema
   */
  async validateSchema() {
    try {
      // Basic validation - check if required tables exist
      const tables = ["users", "sessions", "audit_logs", "config", "migrations"];
      for (const table of tables) {
        await this.queryOne("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [
          table,
        ]);
      }
      return true;
    } catch (error) {
      this.logger?.error("Schema validation failed", error);
      return false;
    }
  }
  /**
   * Get database metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
    };
  }
  /**
   * Health check for database service
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.queryOne("SELECT 1 as health_check");
      const responseTime = Date.now() - startTime;
      const metrics = this.getMetrics();
      const errorRate = metrics.totalQueries > 0 ? metrics.failedQueries / metrics.totalQueries : 0;
      return {
        status: errorRate < 0.1 ? "healthy" : errorRate < 0.5 ? "degraded" : "unhealthy",
        message: "Database service is operational",
        details: {
          responseTime,
          metrics,
          errorRate: Math.round(errorRate * 100) / 100,
        },
      };
    } catch (error) {
      this.metrics.connectionErrors++;
      return {
        status: "unhealthy",
        message: "Database connection failed",
        details: { error: error.message },
      };
    }
  }
  /**
   * Update metrics after query execution
   */
  updateMetrics(success, duration) {
    if (!this.config.enableMetrics) {
      return;
    }
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }
    // Update average query time
    const totalSuccessful = this.metrics.successfulQueries;
    if (totalSuccessful > 0) {
      this.metrics.averageQueryTime =
        (this.metrics.averageQueryTime * (totalSuccessful - 1) + duration) / totalSuccessful;
    }
  }
  /**
   * Delay helper for retry logic
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
//# sourceMappingURL=database-service.js.map
