import type { BaseRecord, DatabaseService, QueryOptions, QueryParams, Repository, WhereCondition } from "../../../../types/database";
/**
 * Base repository implementation with common CRUD operations
 */
export declare abstract class BaseRepository<T extends BaseRecord> implements Repository<T> {
    protected db: DatabaseService;
    protected abstract tableName: string;
    constructor(db: DatabaseService);
    /**
     * Find record by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Find multiple records with options
     */
    findMany(options?: QueryOptions): Promise<T[]>;
    /**
     * Find single record with options
     */
    findOne(options: QueryOptions): Promise<T | null>;
    /**
     * Create new record
     */
    create(data: Omit<T, keyof BaseRecord>): Promise<T>;
    /**
     * Update existing record
     */
    update(id: string, data: Partial<Omit<T, keyof BaseRecord>>): Promise<T>;
    /**
     * Delete record by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Count records with options
     */
    count(options?: QueryOptions): Promise<number>;
    /**
     * Check if record exists by ID
     */
    exists(id: string): Promise<boolean>;
    /**
     * Find records by specific column value
     */
    findBy(column: string, value: string | number | boolean | null): Promise<T[]>;
    /**
     * Find single record by specific column value
     */
    findOneBy(column: string, value: string | number | boolean | null): Promise<T | null>;
    /**
     * Soft delete (if the table has a deleted_at column)
     */
    softDelete(id: string): Promise<boolean>;
    /**
     * Restore soft deleted record
     */
    restore(id: string): Promise<boolean>;
    /**
     * Build SELECT query with options
     */
    protected buildSelectQuery(options: QueryOptions): {
        sql: string;
        params: QueryParams;
    };
    /**
     * Build WHERE clause from conditions
     */
    protected buildWhereClause(conditions: WhereCondition[]): {
        clause: string;
        params: QueryParams;
    };
    /**
     * Execute raw SQL query
     */
    protected raw<R = unknown>(sql: string, params?: QueryParams): Promise<R[]>;
    /**
     * Execute raw SQL query expecting single result
     */
    protected rawOne<R = unknown>(sql: string, params?: QueryParams): Promise<R | null>;
}
//# sourceMappingURL=base-repository.d.ts.map