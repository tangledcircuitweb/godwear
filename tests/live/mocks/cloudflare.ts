import type { KVNamespace, D1Database, R2Bucket } from '@cloudflare/workers-types';
import { vi } from 'vitest';
import { TEST_DB_SCHEMAS } from '../constants';

// Mock KV Namespace implementation
export function createMockKV(name: string): KVNamespace {
  const store = new Map<string, string>();
  const metadata = new Map<string, any>();
  
  console.log(`🗄️  Mock KV created: ${name}`);
  
  return {
    get: vi.fn(async (key: string, options?: any) => {
      const value = store.get(key);
      if (!value) return null;
      
      if (options?.type === 'json') {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      
      if (options?.type === 'arrayBuffer') {
        return new TextEncoder().encode(value).buffer;
      }
      
      return value;
    }),
    
    getWithMetadata: vi.fn(async (key: string, options?: any) => {
      const value = await (this as any).get(key, options);
      return {
        value,
        metadata: metadata.get(key) || null,
      };
    }),
    
    put: vi.fn(async (key: string, value: string | ArrayBuffer | ReadableStream, options?: any) => {
      let stringValue: string;
      
      if (value instanceof ArrayBuffer) {
        stringValue = new TextDecoder().decode(value);
      } else if (value instanceof ReadableStream) {
        // For testing, we'll convert ReadableStream to string
        const reader = value.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value: chunk, done: readerDone } = await reader.read();
          done = readerDone;
          if (chunk) chunks.push(chunk);
        }
        
        const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        stringValue = new TextDecoder().decode(combined);
      } else {
        stringValue = value;
      }
      
      store.set(key, stringValue);
      
      if (options?.metadata) {
        metadata.set(key, options.metadata);
      }
      
      console.log(`📝 KV ${name}: PUT ${key} = ${stringValue.substring(0, 50)}...`);
    }),
    
    delete: vi.fn(async (key: string) => {
      const existed = store.has(key);
      store.delete(key);
      metadata.delete(key);
      console.log(`🗑️  KV ${name}: DELETE ${key} (existed: ${existed})`);
      return existed;
    }),
    
    list: vi.fn(async (options?: any) => {
      const keys = Array.from(store.keys());
      let filteredKeys = keys;
      
      if (options?.prefix) {
        filteredKeys = keys.filter(key => key.startsWith(options.prefix));
      }
      
      const limit = options?.limit || 1000;
      const cursor = options?.cursor || 0;
      const slicedKeys = filteredKeys.slice(cursor, cursor + limit);
      
      return {
        keys: slicedKeys.map(name => ({ name })),
        list_complete: cursor + limit >= filteredKeys.length,
        cursor: cursor + limit < filteredKeys.length ? (cursor + limit).toString() : '',
      };
    }),
  } as unknown as KVNamespace;
}

// Mock D1 Database implementation
export function createMockD1(): D1Database {
  const tables = new Map<string, any[]>();
  let initialized = false;
  
  const initializeDatabase = async () => {
    if (initialized) return;
    
    // Create tables
    console.log('🗃️  Mock D1: Initializing database schema');
    tables.set('users', []);
    tables.set('sessions', []);
    
    initialized = true;
  };
  
  const executeQuery = async (query: string, params: any[] = []) => {
    await initializeDatabase();
    
    const normalizedQuery = query.trim().toLowerCase();
    console.log(`🔍 Mock D1: ${normalizedQuery.substring(0, 50)}...`);
    
    // Handle CREATE TABLE
    if (normalizedQuery.startsWith('create table')) {
      return { success: true, meta: { changes: 0 } };
    }
    
    // Handle INSERT
    if (normalizedQuery.startsWith('insert into')) {
      const tableMatch = query.match(/insert into (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1].toLowerCase();
        const table = tables.get(tableName) || [];
        
        // Simple mock - generate a record with provided params
        const record: any = { id: `test-${Date.now()}-${Math.random()}` };
        params.forEach((param, index) => {
          record[`field_${index}`] = param;
        });
        
        table.push(record);
        tables.set(tableName, table);
        
        return {
          success: true,
          meta: { changes: 1, last_row_id: table.length },
          results: [record],
        };
      }
    }
    
    // Handle SELECT
    if (normalizedQuery.startsWith('select')) {
      const tableMatch = query.match(/from (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1].toLowerCase();
        const table = tables.get(tableName) || [];
        
        // Simple filtering for WHERE clauses
        let results = [...table];
        if (query.includes('WHERE') || query.includes('where')) {
          // For testing, return first result or empty array
          results = table.length > 0 ? [table[0]] : [];
        }
        
        return {
          success: true,
          results,
          meta: { served_by: 'mock-d1' },
        };
      }
    }
    
    // Handle UPDATE
    if (normalizedQuery.startsWith('update')) {
      const tableMatch = query.match(/update (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1].toLowerCase();
        const table = tables.get(tableName) || [];
        
        // Mock update - modify first matching record
        if (table.length > 0) {
          params.forEach((param, index) => {
            table[0][`field_${index}`] = param;
          });
        }
        
        return {
          success: true,
          meta: { changes: table.length > 0 ? 1 : 0 },
        };
      }
    }
    
    // Handle DELETE
    if (normalizedQuery.startsWith('delete')) {
      const tableMatch = query.match(/from (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1].toLowerCase();
        const table = tables.get(tableName) || [];
        const originalLength = table.length;
        
        // Mock delete - clear table or remove first item
        if (query.includes('WHERE') || query.includes('where')) {
          table.splice(0, 1); // Remove first item
        } else {
          table.length = 0; // Clear all
        }
        
        return {
          success: true,
          meta: { changes: originalLength - table.length },
        };
      }
    }
    
    return { success: true, results: [], meta: { changes: 0 } };
  };
  
  console.log('🗃️  Mock D1 database created');
  
  return {
    prepare: vi.fn((query: string) => ({
      bind: vi.fn((...params: any[]) => ({
        first: vi.fn(async () => {
          const result = await executeQuery(query, params);
          return result.results?.[0] || null;
        }),
        all: vi.fn(async () => {
          const result = await executeQuery(query, params);
          return { results: result.results || [], success: true };
        }),
        run: vi.fn(async () => {
          return await executeQuery(query, params);
        }),
      })),
      first: vi.fn(async () => {
        const result = await executeQuery(query, []);
        return result.results?.[0] || null;
      }),
      all: vi.fn(async () => {
        const result = await executeQuery(query, []);
        return { results: result.results || [], success: true };
      }),
      run: vi.fn(async () => {
        return await executeQuery(query, []);
      }),
    })),
    
    exec: vi.fn(async (query: string) => {
      return await executeQuery(query, []);
    }),
    
    batch: vi.fn(async (statements: any[]) => {
      const results = [];
      for (const stmt of statements) {
        const result = await executeQuery(stmt.query || stmt, stmt.params || []);
        results.push(result);
      }
      return results;
    }),
    
    dump: vi.fn(async () => {
      return new ArrayBuffer(0);
    }),
  } as unknown as D1Database;
}

// Mock R2 Bucket implementation
export function createMockR2(name: string): R2Bucket {
  const objects = new Map<string, { body: ArrayBuffer; metadata?: any }>();
  
  console.log(`🪣 Mock R2 bucket created: ${name}`);
  
  return {
    get: vi.fn(async (key: string) => {
      const obj = objects.get(key);
      if (!obj) return null;
      
      return {
        key,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(obj.body));
            controller.close();
          },
        }),
        bodyUsed: false,
        arrayBuffer: vi.fn(async () => obj.body),
        text: vi.fn(async () => new TextDecoder().decode(obj.body)),
        json: vi.fn(async () => JSON.parse(new TextDecoder().decode(obj.body))),
        blob: vi.fn(async () => new Blob([obj.body])),
        size: obj.body.byteLength,
        etag: `"${key}-etag"`,
        httpEtag: `"${key}-etag"`,
        uploaded: new Date(),
        version: '1',
        checksums: {},
        httpMetadata: {},
        customMetadata: obj.metadata || {},
        range: undefined,
      };
    }),
    
    put: vi.fn(async (key: string, value: any, options?: any) => {
      let buffer: ArrayBuffer;
      
      if (value instanceof ArrayBuffer) {
        buffer = value;
      } else if (typeof value === 'string') {
        buffer = new TextEncoder().encode(value).buffer;
      } else if (value instanceof ReadableStream) {
        // Convert ReadableStream to ArrayBuffer for testing
        const reader = value.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value: chunk, done: readerDone } = await reader.read();
          done = readerDone;
          if (chunk) chunks.push(chunk);
        }
        
        const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        buffer = combined.buffer;
      } else {
        buffer = new TextEncoder().encode(JSON.stringify(value)).buffer;
      }
      
      objects.set(key, { body: buffer, metadata: options?.customMetadata });
      console.log(`📤 R2 ${name}: PUT ${key} (${buffer.byteLength} bytes)`);
      
      return {
        key,
        etag: `"${key}-etag"`,
        size: buffer.byteLength,
        version: '1',
      };
    }),
    
    delete: vi.fn(async (key: string) => {
      const existed = objects.has(key);
      objects.delete(key);
      console.log(`🗑️  R2 ${name}: DELETE ${key} (existed: ${existed})`);
    }),
    
    list: vi.fn(async (options?: any) => {
      const keys = Array.from(objects.keys());
      let filteredKeys = keys;
      
      if (options?.prefix) {
        filteredKeys = keys.filter(key => key.startsWith(options.prefix));
      }
      
      const limit = options?.limit || 1000;
      const cursor = options?.cursor || 0;
      const slicedKeys = filteredKeys.slice(cursor, cursor + limit);
      
      return {
        objects: slicedKeys.map(key => {
          const obj = objects.get(key)!;
          return {
            key,
            size: obj.body.byteLength,
            etag: `"${key}-etag"`,
            httpEtag: `"${key}-etag"`,
            uploaded: new Date(),
            checksums: {},
            httpMetadata: {},
            customMetadata: obj.metadata || {},
          };
        }),
        truncated: cursor + limit < filteredKeys.length,
        cursor: cursor + limit < filteredKeys.length ? (cursor + limit).toString() : undefined,
      };
    }),
    
    head: vi.fn(async (key: string) => {
      const obj = objects.get(key);
      if (!obj) return null;
      
      return {
        key,
        size: obj.body.byteLength,
        etag: `"${key}-etag"`,
        httpEtag: `"${key}-etag"`,
        uploaded: new Date(),
        version: '1',
        checksums: {},
        httpMetadata: {},
        customMetadata: obj.metadata || {},
      };
    }),
  } as unknown as R2Bucket;
}
