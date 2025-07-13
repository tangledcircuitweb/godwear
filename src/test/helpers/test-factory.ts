import { Hono } from 'hono';
import type { TestEnv, TestUser, TestApp } from '../types';
import { createMockEnv } from '../setup';
import { createAuthContext, generateTestJWT } from './auth';
import { aUser, aRequest, aResponse } from './data-builders';
import { fixtures } from '../fixtures';

// Main test factory class
export class TestFactory {
  private env: TestEnv;
  private app?: TestApp;
  
  constructor() {
    this.env = createMockEnv();
  }
  
  // Create test application instance
  createApp(): TestApp {
    if (!this.app) {
      this.app = new Hono<{ Bindings: TestEnv }>();
    }
    return this.app;
  }
  
  // Get mock environment
  getEnv(): TestEnv {
    return this.env;
  }
  
  // Create authenticated request
  createAuthenticatedRequest(path: string, user?: TestUser, options: RequestInit = {}): Request {
    const testUser = user || fixtures.users.regularUser;
    const token = generateTestJWT({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
    
    return new Request(`http://localhost:3000${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Create admin request
  createAdminRequest(path: string, options: RequestInit = {}): Request {
    return this.createAuthenticatedRequest(path, fixtures.users.adminUser, options);
  }
  
  // Execute request against app
  async executeRequest(request: Request): Promise<Response> {
    if (!this.app) {
      throw new Error('App not created. Call createApp() first.');
    }
    
    return await this.app.request(request, this.env);
  }
  
  // Helper for GET requests
  async get(path: string, user?: TestUser): Promise<Response> {
    const request = user 
      ? this.createAuthenticatedRequest(path, user)
      : new Request(`http://localhost:3000${path}`);
    
    return await this.executeRequest(request);
  }
  
  // Helper for POST requests
  async post(path: string, body?: any, user?: TestUser): Promise<Response> {
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const request = user 
      ? this.createAuthenticatedRequest(path, user, options)
      : new Request(`http://localhost:3000${path}`, options);
    
    return await this.executeRequest(request);
  }
  
  // Helper for PUT requests
  async put(path: string, body?: any, user?: TestUser): Promise<Response> {
    const options: RequestInit = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const request = user 
      ? this.createAuthenticatedRequest(path, user, options)
      : new Request(`http://localhost:3000${path}`, options);
    
    return await this.executeRequest(request);
  }
  
  // Helper for PATCH requests
  async patch(path: string, body?: any, user?: TestUser): Promise<Response> {
    const options: RequestInit = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const request = user 
      ? this.createAuthenticatedRequest(path, user, options)
      : new Request(`http://localhost:3000${path}`, options);
    
    return await this.executeRequest(request);
  }
  
  // Helper for DELETE requests
  async delete(path: string, user?: TestUser): Promise<Response> {
    const options: RequestInit = {
      method: 'DELETE',
    };
    
    const request = user 
      ? this.createAuthenticatedRequest(path, user, options)
      : new Request(`http://localhost:3000${path}`, options);
    
    return await this.executeRequest(request);
  }
  
  // Database helpers
  async seedUser(user?: Partial<TestUser>): Promise<TestUser> {
    const testUser = aUser().with(user || {}).build();
    
    // Insert into mock database
    const userRecord = fixtures.database.userRecord(testUser);
    await this.env.DB.prepare(`
      INSERT INTO users (id, email, name, role, provider, provider_id, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userRecord.id,
      userRecord.email,
      userRecord.name,
      userRecord.role,
      userRecord.provider,
      userRecord.provider_id,
      userRecord.email_verified,
      userRecord.created_at,
      userRecord.updated_at
    ).run();
    
    console.log('🌱 Seeded user:', testUser.email);
    return testUser;
  }
  
  async seedUsers(count: number, overrides?: Partial<TestUser>): Promise<TestUser[]> {
    const users: TestUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = await this.seedUser({
        ...overrides,
        email: `seed-user-${i}-${Date.now()}@godwear.com`,
        name: `Seed User ${i + 1}`,
      });
      users.push(user);
    }
    
    console.log(`🌱 Seeded ${count} users`);
    return users;
  }
  
  // Session helpers
  async createSession(user: TestUser): Promise<string> {
    const sessionRecord = fixtures.database.sessionRecord(user.id);
    
    await this.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      sessionRecord.id,
      sessionRecord.user_id,
      sessionRecord.expires_at,
      sessionRecord.created_at
    ).run();
    
    // Store in KV for quick access
    await this.env.SESSION_STORE.put(sessionRecord.id, JSON.stringify({
      userId: user.id,
      expiresAt: sessionRecord.expires_at,
    }));
    
    console.log('🔐 Created session for user:', user.email);
    return sessionRecord.id;
  }
  
  // Cache helpers
  async setCache(key: string, value: any, ttl?: number): Promise<void> {
    const options: any = {};
    if (ttl) {
      options.expirationTtl = ttl;
    }
    
    await this.env.CACHE.put(key, JSON.stringify(value), options);
    console.log('💾 Set cache:', key);
  }
  
  async getCache(key: string): Promise<any> {
    const value = await this.env.CACHE.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  // Cleanup helpers
  async cleanup(): Promise<void> {
    // Clear all KV stores
    const kvStores = [this.env.CACHE, this.env.SESSION_STORE, this.env.USER_SESSIONS];
    
    for (const store of kvStores) {
      const { keys } = await store.list();
      for (const key of keys) {
        await store.delete(key.name);
      }
    }
    
    // Clear database tables
    await this.env.DB.exec('DELETE FROM users');
    await this.env.DB.exec('DELETE FROM sessions');
    
    console.log('🧹 Test cleanup completed');
  }
  
  // Reset factory state
  reset(): void {
    this.env = createMockEnv();
    this.app = undefined;
    console.log('🔄 Test factory reset');
  }
}

// Convenience function to create a new test factory
export function createTestFactory(): TestFactory {
  return new TestFactory();
}

// Legacy support - create test app function
export function createTestApp() {
  const factory = new TestFactory();
  const app = factory.createApp();
  const env = factory.getEnv();
  
  return {
    app,
    env,
    factory,
    request: (path: string, init?: RequestInit) => {
      return app.request(path, init, env);
    },
  };
}

// Export builders for convenience
export { aUser, aRequest, aResponse };
export { fixtures };

// Export default factory instance for simple tests
export const testFactory = new TestFactory();
