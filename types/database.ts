import type { z } from "zod";

/**
 * Base database record interface
 */
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * User database record
 */
export interface UserRecord extends BaseRecord {
  email: string;
  name: string;
  picture?: string | null;
  verified_email: boolean;
  last_login_at?: string | null;
  status: "active" | "inactive" | "suspended";
  metadata?: string | null; // JSON string
}

/**
 * Session database record for user sessions
 */
export interface SessionRecord extends BaseRecord {
  user_id: string;
  token_hash: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_active: boolean;
}

/**
 * Audit log record for tracking changes
 */
export interface AuditLogRecord extends BaseRecord {
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  old_values?: string | null; // JSON string
  new_values?: string | null; // JSON string
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Configuration record for app settings
 */
export interface ConfigRecord extends BaseRecord {
  key: string;
  value: string;
  description?: string | null;
  is_public: boolean;
  category: string;
}

/**
 * Database query result types
 */
export interface QueryResult<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface SingleQueryResult<T = unknown> {
  result: T | null;
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

/**
 * Database transaction interface
 */
export interface DatabaseTransaction {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
  dump(): Promise<ArrayBuffer>;
}

/**
 * Query builder types
 */
export type WhereCondition = {
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN" | "IS NULL" | "IS NOT NULL";
  value?: unknown;
};

export type OrderByClause = {
  column: string;
  direction: "ASC" | "DESC";
};

export type JoinClause = {
  type: "INNER" | "LEFT" | "RIGHT" | "FULL";
  table: string;
  on: string;
};

export interface QueryOptions {
  where?: WhereCondition[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  joins?: JoinClause[];
}

/**
 * Migration interface
 */
export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  created_at: string;
}

export interface MigrationRecord extends BaseRecord {
  migration_id: string;
  name: string;
  executed_at: string;
  checksum: string;
}

/**
 * Database schema validation types
 */
export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
}

export interface ColumnSchema {
  name: string;
  type: "TEXT" | "INTEGER" | "REAL" | "BLOB" | "NULL";
  nullable: boolean;
  default?: string | number | null;
  primary_key: boolean;
  unique: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ConstraintSchema {
  name: string;
  type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK";
  definition: string;
}

/**
 * Database service configuration
 */
export interface DatabaseConfig {
  maxRetries: number;
  retryDelay: number;
  queryTimeout: number;
  enableQueryLogging: boolean;
  enableMetrics: boolean;
}

/**
 * Database metrics
 */
export interface DatabaseMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionErrors: number;
  lastError?: string;
  lastErrorTime?: string;
}

/**
 * Typed query parameters
 */
export type QueryParams = (string | number | boolean | null)[];

/**
 * Database error types
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly query?: string,
    public readonly params?: QueryParams
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class QueryTimeoutError extends DatabaseError {
  constructor(query: string, timeout: number) {
    super(`Query timed out after ${timeout}ms`, "QUERY_TIMEOUT", query);
    this.name = "QueryTimeoutError";
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string) {
    super(message, "CONNECTION_ERROR");
    this.name = "ConnectionError";
  }
}

export class MigrationError extends DatabaseError {
  constructor(message: string, public readonly migrationId?: string) {
    super(message, "MIGRATION_ERROR");
    this.name = "MigrationError";
  }
}

/**
 * Repository interface for typed database operations
 */
export interface Repository<T extends BaseRecord> {
  findById(id: string): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<T[]>;
  findOne(options: QueryOptions): Promise<T | null>;
  create(data: Omit<T, keyof BaseRecord>): Promise<T>;
  update(id: string, data: Partial<Omit<T, keyof BaseRecord>>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(options?: QueryOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
}

/**
 * Database service interface
 */
export interface DatabaseService {
  // Connection management
  getConnection(): DatabaseConnection;
  healthCheck(): Promise<ServiceHealthStatus>;
  
  // Query execution
  query<T = unknown>(sql: string, params?: QueryParams): Promise<QueryResult<T>>;
  queryOne<T = unknown>(sql: string, params?: QueryParams): Promise<SingleQueryResult<T>>;
  execute(sql: string, params?: QueryParams): Promise<D1Result>;
  
  // Transaction support
  transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
  
  // Migration support
  runMigrations(): Promise<void>;
  rollbackMigration(migrationId: string): Promise<void>;
  getMigrationStatus(): Promise<MigrationRecord[]>;
  
  // Schema management
  getTableSchema(tableName: string): Promise<TableSchema>;
  validateSchema(): Promise<boolean>;
  
  // Metrics and monitoring
  getMetrics(): DatabaseMetrics;
  resetMetrics(): void;
}

/**
 * Service health status (imported from base service)
 */
export interface ServiceHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
}
