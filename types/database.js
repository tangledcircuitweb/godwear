/**
 * Database error types
 */
export class DatabaseError extends Error {
    code;
    query;
    params;
    constructor(message, code, query, params) {
        super(message);
        this.code = code;
        this.query = query;
        this.params = params;
        this.name = "DatabaseError";
    }
}
export class QueryTimeoutError extends DatabaseError {
    constructor(query, timeout) {
        super(`Query timed out after ${timeout}ms`, "QUERY_TIMEOUT", query);
        this.name = "QueryTimeoutError";
    }
}
export class ConnectionError extends DatabaseError {
    constructor(message) {
        super(message, "CONNECTION_ERROR");
        this.name = "ConnectionError";
    }
}
export class MigrationError extends DatabaseError {
    migrationId;
    constructor(message, migrationId) {
        super(message, "MIGRATION_ERROR");
        this.migrationId = migrationId;
        this.name = "MigrationError";
    }
}
//# sourceMappingURL=database.js.map