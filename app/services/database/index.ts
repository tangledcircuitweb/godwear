// Database service exports
export { D1DatabaseService } from "./database-service";
export { RepositoryRegistry } from "./repository-registry";

// Repository exports
export { BaseRepository } from "./repositories/base-repository";
export { UserRepository } from "./repositories/user-repository";
export { SessionRepository } from "./repositories/session-repository";
export { AuditLogRepository } from "./repositories/audit-log-repository";

// Re-export database types
export type {
  DatabaseService,
  DatabaseConfig,
  DatabaseMetrics,
  QueryOptions,
  QueryParams,
  QueryResult,
  SingleQueryResult,
  Repository,
  BaseRecord,
  UserRecord,
  SessionRecord,
  AuditLogRecord,
  ConfigRecord,
  Migration,
  MigrationRecord,
  WhereCondition,
  OrderByClause,
  JoinClause,
  TableSchema,
  ColumnSchema,
  IndexSchema,
  ConstraintSchema,
  DatabaseError,
  QueryTimeoutError,
  ConnectionError,
  MigrationError,
} from "../../../types/database";
