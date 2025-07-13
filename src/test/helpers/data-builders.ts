import type { TestUser, TestDataBuilderOptions } from '../types';
import { createTestUser } from './auth';

// Base data builder class
abstract class BaseDataBuilder<T> {
  protected data: Partial<T> = {};
  
  abstract build(): T;
  
  with(overrides: Partial<T>): this {
    this.data = { ...this.data, ...overrides };
    return this;
  }
  
  buildMany(count: number): T[] {
    return Array.from({ length: count }, () => this.build());
  }
}

// User data builder
export class UserBuilder extends BaseDataBuilder<TestUser> {
  constructor() {
    super();
    this.data = {
      role: 'USER',
      provider: 'email',
      emailVerified: true,
    };
  }
  
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }
  
  withName(name: string): this {
    this.data.name = name;
    return this;
  }
  
  withRole(role: 'USER' | 'ADMIN'): this {
    this.data.role = role;
    return this;
  }
  
  withProvider(provider: 'email' | 'google' | 'github'): this {
    this.data.provider = provider;
    if (provider !== 'email') {
      this.data.providerId = `${provider}-${Date.now()}`;
    }
    return this;
  }
  
  asAdmin(): this {
    return this.withRole('ADMIN');
  }
  
  asUnverified(): this {
    this.data.emailVerified = false;
    return this;
  }
  
  asGoogleUser(): this {
    return this.withProvider('google');
  }
  
  asGitHubUser(): this {
    return this.withProvider('github');
  }
  
  build(): TestUser {
    return createTestUser(this.data);
  }
}

// API Request builder
export class RequestBuilder {
  private method: string = 'GET';
  private url: string = '/';
  private headers: Record<string, string> = {};
  private body: any = null;
  private user?: TestUser;
  
  get(url: string): this {
    this.method = 'GET';
    this.url = url;
    return this;
  }
  
  post(url: string): this {
    this.method = 'POST';
    this.url = url;
    return this;
  }
  
  put(url: string): this {
    this.method = 'PUT';
    this.url = url;
    return this;
  }
  
  patch(url: string): this {
    this.method = 'PATCH';
    this.url = url;
    return this;
  }
  
  delete(url: string): this {
    this.method = 'DELETE';
    this.url = url;
    return this;
  }
  
  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
  
  withBody(body: any): this {
    this.body = body;
    if (body && typeof body === 'object') {
      this.headers['Content-Type'] = 'application/json';
    }
    return this;
  }
  
  withAuth(user: TestUser): this {
    this.user = user;
    // JWT token will be added in build()
    return this;
  }
  
  withBearerToken(token: string): this {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }
  
  build(): Request {
    const url = this.url.startsWith('http') ? this.url : `http://localhost:3000${this.url}`;
    
    const init: RequestInit = {
      method: this.method,
      headers: this.headers,
    };
    
    if (this.body) {
      init.body = typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    
    // Add auth token if user is provided
    if (this.user) {
      const { createAuthenticatedRequest } = globalThis;
      if (createAuthenticatedRequest) {
        return createAuthenticatedRequest(this.url, init);
      }
    }
    
    return new Request(url, init);
  }
}

// Response builder for mocking
export class ResponseBuilder {
  private status: number = 200;
  private headers: Record<string, string> = {};
  private body: any = null;
  
  withStatus(status: number): this {
    this.status = status;
    return this;
  }
  
  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
  
  withBody(body: any): this {
    this.body = body;
    return this;
  }
  
  asSuccess(data?: any): this {
    this.status = 200;
    this.body = { success: true, data };
    return this;
  }
  
  asCreated(data?: any): this {
    this.status = 201;
    this.body = { success: true, data };
    return this;
  }
  
  asError(code: string, message: string, status: number = 400): this {
    this.status = status;
    this.body = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    };
    return this;
  }
  
  asValidationError(details: Record<string, string>): this {
    this.status = 422;
    this.body = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        timestamp: new Date().toISOString(),
        details,
      },
    };
    return this;
  }
  
  asUnauthorized(): this {
    return this.asError('UNAUTHORIZED', 'Authentication required', 401);
  }
  
  asForbidden(): this {
    return this.asError('FORBIDDEN', 'Access denied', 403);
  }
  
  asNotFound(): this {
    return this.asError('NOT_FOUND', 'Resource not found', 404);
  }
  
  build(): Response {
    const init: ResponseInit = {
      status: this.status,
      headers: this.headers,
    };
    
    const body = this.body ? JSON.stringify(this.body) : null;
    return new Response(body, init);
  }
}

// Database record builders
export class DatabaseBuilder {
  static userRecord(overrides: Partial<any> = {}) {
    const user = new UserBuilder().build();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
      provider_id: user.providerId || null,
      email_verified: user.emailVerified ? 1 : 0,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      ...overrides,
    };
  }
  
  static sessionRecord(userId: string, overrides: Partial<any> = {}) {
    const sessionId = `session-${userId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    
    return {
      id: sessionId,
      user_id: userId,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }
}

// Email data builders
export class EmailBuilder {
  private to: string[] = [];
  private from: string = 'noreply@godwear.com';
  private subject: string = 'Test Email';
  private html: string = '<p>Test email content</p>';
  private text: string = 'Test email content';
  private templateId?: string;
  private variables: Record<string, any> = {};
  
  withTo(emails: string | string[]): this {
    this.to = Array.isArray(emails) ? emails : [emails];
    return this;
  }
  
  withFrom(email: string): this {
    this.from = email;
    return this;
  }
  
  withSubject(subject: string): this {
    this.subject = subject;
    return this;
  }
  
  withHtml(html: string): this {
    this.html = html;
    return this;
  }
  
  withText(text: string): this {
    this.text = text;
    return this;
  }
  
  withTemplate(templateId: string, variables: Record<string, any> = {}): this {
    this.templateId = templateId;
    this.variables = variables;
    return this;
  }
  
  asWelcomeEmail(userName: string): this {
    return this
      .withSubject('Welcome to GodWear!')
      .withTemplate('welcome', { userName });
  }
  
  asPasswordResetEmail(resetLink: string): this {
    return this
      .withSubject('Reset Your Password')
      .withTemplate('password-reset', { resetLink });
  }
  
  asEmailVerificationEmail(verificationLink: string): this {
    return this
      .withSubject('Verify Your Email')
      .withTemplate('email-verification', { verificationLink });
  }
  
  build() {
    return {
      to: this.to.map(email => ({ email })),
      from: { email: this.from },
      subject: this.subject,
      html: this.html,
      text: this.text,
      template_id: this.templateId,
      variables: this.variables,
    };
  }
}

// Factory functions for easy access
export const TestData = {
  user: () => new UserBuilder(),
  request: () => new RequestBuilder(),
  response: () => new ResponseBuilder(),
  email: () => new EmailBuilder(),
  database: DatabaseBuilder,
};

// Convenience functions
export function aUser() {
  return new UserBuilder();
}

export function aRequest() {
  return new RequestBuilder();
}

export function aResponse() {
  return new ResponseBuilder();
}

export function anEmail() {
  return new EmailBuilder();
}

// Batch data generation
export function generateUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
  return Array.from({ length: count }, () => createTestUser(overrides));
}

export function generateUserRecords(count: number, overrides: Partial<any> = {}) {
  return Array.from({ length: count }, () => DatabaseBuilder.userRecord(overrides));
}
