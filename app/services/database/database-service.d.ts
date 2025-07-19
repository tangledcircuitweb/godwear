import { z } from "zod";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";

// Import types from the implementation file
export type DatabaseConfig = {
  maxRetries: number;
  retryDelay: number;
  queryTimeout: number;
  enableQueryLogging: boolean;
  enableMetrics: boolean;
};

export type DatabaseMetrics = {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionErrors: number;
  lastError?: string;
  lastErrorTime?: string;
};

export type QueryParams = (string | number | boolean | null)[];

export type QueryResult<T = unknown> = {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
};

export type SingleQueryResult<T = unknown> = {
  result: T | null;
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
};

export type TableSchema = {
  name: string;
  columns: {
    name: string;
    type: "TEXT" | "INTEGER" | "REAL" | "BLOB" | "NULL";
    nullable: boolean;
    default?: string | number | null;
    primary_key: boolean;
    unique: boolean;
  }[];
  indexes: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  constraints: {
    name: string;
    type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK";
    definition: string;
  }[];
};

export type MigrationRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  migration_id: string;
  name: string;
  executed_at: string;
  checksum: string;
};

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
 * Comprehensive database service for D1 integration
 */
export declare class D1DatabaseService implements BaseService, DatabaseService {
    readonly serviceName: string;
    
    // Static schema exports
    static readonly DatabaseConfigSchema: z.ZodObject<any>;
    static readonly DatabaseMetricsSchema: z.ZodObject<any>;
    static readonly QueryParamsSchema: z.ZodArray<any>;
    static readonly WhereConditionSchema: z.ZodObject<any>;
    static readonly OrderByClauseSchema: z.ZodObject<any>;
    static readonly JoinClauseSchema: z.ZodObject<any>;
    static readonly QueryOptionsSchema: z.ZodObject<any>;
    static readonly QueryResultSchema: z.ZodObject<any>;
    static readonly SingleQueryResultSchema: z.ZodObject<any>;
    static readonly TableSchemaSchema: z.ZodObject<any>;
    static readonly MigrationSchema: z.ZodObject<any>;
    static readonly MigrationRecordSchema: z.ZodObject<any>;
    
    private env;
    private logger?;
    private config;
    private metrics;
    constructor(config?: Partial<DatabaseConfig>);
    initialize(dependencies: ServiceDependencies): void;
    /**
     * Get database connection
     */
    getConnection(): DatabaseConnection;
    /**
     * Execute a query with retry logic and metrics
     */
    query<T = unknown>(sql: string, params?: QueryParams): Promise<QueryResult<T>>;
    /**
     * Execute a query expecting a single result
     */
    queryOne<T = unknown>(sql: string, params?: QueryParams): Promise<SingleQueryResult<T>>;
    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     */
    execute(sql: string, params?: QueryParams): Promise<D1Result>;
    /**
     * Execute multiple statements in a batch
     */
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
    /**
     * Execute operations in a transaction
     */
    transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
    /**
     * Build WHERE clause from conditions
     */
    private buildWhereClause;
    /**
     * Build ORDER BY clause
     */
    private buildOrderByClause;
    /**
     * Build LIMIT and OFFSET clause
     */
    private buildLimitClause;
    /**
     * Run database migrations
     */
    runMigrations(): Promise<void>;
    /**
     * Get pending migrations
     */
    private getPendingMigrations;
    /**
     * Run a single migration
     */
    private runMigration;
    /**
     * Calculate checksum for migration
     */
    private calculateChecksum;
    /**
     * Rollback a migration
     */
    rollbackMigration(_migrationId: string): Promise<void>;
    /**
     * Get migration status
     */
    getMigrationStatus(): Promise<MigrationRecord[]>;
    /**
     * Get table schema
     */
    getTableSchema(_tableName: string): Promise<TableSchema>;
    /**
     * Validate database schema
     */
    validateSchema(): Promise<boolean>;
    /**
     * Get database metrics
     */
    getMetrics(): DatabaseMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Health check for database service
     */
    healthCheck(): Promise<ServiceHealthStatus>;
    /**
     * Update metrics after query execution
     */
    private updateMetrics;
    /**
     * Delay helper for retry logic
     */
    private delay;
}
//# sourceMappingURL=database-service.d.ts.map