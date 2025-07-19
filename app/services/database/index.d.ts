// Re-export database types from local files
export type {
  DatabaseConfig,
  DatabaseMetrics,
  QueryParams,
  QueryResult,
  SingleQueryResult,
  TableSchema,
  MigrationRecord,
  DatabaseTransaction,
  DatabaseConnection,
  DatabaseService,
} from "./database-service";

export type {
  BaseRecord,
  WhereCondition,
  QueryOptions,
  Repository,
} from "./repositories/base-repository";

export type {
  UserRecord,
} from "./repositories/user-repository";

export type {
  SessionRecord,
} from "./repositories/session-repository";

export type {
  AuditLogRecord,
} from "./repositories/audit-log-repository";

// Export classes
export { D1DatabaseService } from "./database-service";
export { AuditLogRepository } from "./repositories/audit-log-repository";
export { BaseRepository } from "./repositories/base-repository";
export { SessionRepository } from "./repositories/session-repository";
export { UserRepository } from "./repositories/user-repository";
export { RepositoryRegistry } from "./repository-registry";