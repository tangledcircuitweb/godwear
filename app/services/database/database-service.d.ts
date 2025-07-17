import type { DatabaseConfig, DatabaseConnection, DatabaseMetrics, DatabaseService, DatabaseTransaction, MigrationRecord, QueryParams, QueryResult, SingleQueryResult, TableSchema } from "../../../types/database";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";
/**
 * Comprehensive database service for D1 integration
 */
export declare class D1DatabaseService implements BaseService, DatabaseService {
    readonly serviceName = "database-service";
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