import { vi } from 'vitest';
import type { 
  DatabaseService, 
  QueryResult, 
  SingleQueryResult, 
  QueryParams,
  ServiceHealthStatus,
  DatabaseConnection,
  DatabaseTransaction,
  MigrationRecord,
  TableSchema,
  DatabaseMetrics
} from '../../../types/database';

/**
 * Mock DatabaseService for testing
 */
export function createMockDatabaseService(): DatabaseService {
  const mockData = new Map<string, any[]>();
  
  // Initialize with empty tables
  mockData.set('users', []);
  mockData.set('sessions', []);
  mockData.set('audit_logs', []);

  return {
    // Query methods
    async query<T = unknown>(sql: string, params?: QueryParams): Promise<QueryResult<T>> {
      console.log(`🔍 Mock DB Query: ${sql.substring(0, 50)}...`, params);
      
      const normalizedSql = sql.trim().toLowerCase();
      
      // Handle SELECT queries
      if (normalizedSql.startsWith('select')) {
        const tableMatch = sql.match(/from\s+(\w+)/i);
        const tableName = tableMatch?.[1]?.toLowerCase() || 'unknown';
        const table = mockData.get(tableName) || [];
        
        // Simple filtering for WHERE clauses
        let results = [...table];
        if (normalizedSql.includes('where') && params && params.length > 0) {
          // Very basic WHERE simulation - just return first match or empty
          results = table.filter(row => 
            Object.values(row).some(value => 
              params.some(param => value === param)
            )
          );
        }
        
        return {
          results: results as T[],
          success: true,
          meta: {
            duration: 1,
            rows_read: results.length,
            rows_written: 0
          }
        };
      }
      
      return {
        results: [] as T[],
        success: true,
        meta: { duration: 1, rows_read: 0, rows_written: 0 }
      };
    },

    async queryOne<T = unknown>(sql: string, params?: QueryParams): Promise<SingleQueryResult<T>> {
      console.log(`🔍 Mock DB QueryOne: ${sql.substring(0, 50)}...`, params);
      
      const queryResult = await this.query<T>(sql, params);
      const result = queryResult.results.length > 0 ? queryResult.results[0] : null;
      
      return {
        result,
        success: true,
        meta: queryResult.meta
      };
    },

    async execute(sql: string, params?: QueryParams): Promise<D1Result> {
      console.log(`🔍 Mock DB Execute: ${sql.substring(0, 50)}...`, params);
      
      const normalizedSql = sql.trim().toLowerCase();
      let changes = 0;
      
      // Handle INSERT
      if (normalizedSql.startsWith('insert into')) {
        const tableMatch = sql.match(/insert into\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const table = mockData.get(tableName) || [];
          
          // Create a mock record
          const record: any = {
            id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Add params as fields (simplified)
          if (params) {
            params.forEach((param, index) => {
              record[`field_${index}`] = param;
            });
          }
          
          table.push(record);
          mockData.set(tableName, table);
          changes = 1;
        }
      }
      
      // Handle UPDATE
      if (normalizedSql.startsWith('update')) {
        const tableMatch = sql.match(/update\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const table = mockData.get(tableName) || [];
          
          // Simple update simulation
          if (table.length > 0) {
            changes = 1;
            // Update the first matching record
            table[0] = { ...table[0], updated_at: new Date().toISOString() };
          }
        }
      }
      
      // Handle DELETE
      if (normalizedSql.startsWith('delete from')) {
        const tableMatch = sql.match(/delete from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const table = mockData.get(tableName) || [];
          
          if (table.length > 0) {
            table.splice(0, 1); // Remove first item
            changes = 1;
          }
        }
      }
      
      return {
        success: true,
        meta: {
          duration: 1,
          rows_read: 0,
          rows_written: changes,
          changes,
          last_row_id: changes > 0 ? Math.floor(Math.random() * 1000) : undefined,
          size_after: 1024
        }
      };
    },

    // Connection management
    getConnection(): DatabaseConnection {
      return {
        prepare: vi.fn(),
        batch: vi.fn(),
        exec: vi.fn(),
        dump: vi.fn()
      } as any;
    },

    async healthCheck(): Promise<ServiceHealthStatus> {
      return {
        status: 'healthy',
        message: 'Mock database service is healthy'
      };
    },

    // Transaction support
    async transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
      const mockTx: DatabaseTransaction = {
        prepare: vi.fn(),
        batch: vi.fn(),
        exec: vi.fn()
      };
      return callback(mockTx);
    },

    // Migration support
    async runMigrations(): Promise<void> {
      console.log('🔄 Mock DB: Running migrations');
    },

    async rollbackMigration(_migrationId: string): Promise<void> {
      console.log('🔄 Mock DB: Rolling back migration');
    },

    async getMigrationStatus(): Promise<MigrationRecord[]> {
      return [];
    },

    // Schema management
    async getTableSchema(_tableName: string): Promise<TableSchema> {
      return {
        name: _tableName,
        columns: [],
        indexes: [],
        constraints: []
      };
    },

    async validateSchema(): Promise<boolean> {
      return true;
    },

    // Metrics
    getMetrics(): DatabaseMetrics {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        connectionErrors: 0
      };
    },

    resetMetrics(): void {
      console.log('📊 Mock DB: Metrics reset');
    }
  };
}
