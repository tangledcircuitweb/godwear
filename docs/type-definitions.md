# GodWear Type Definitions

## Overview

This document provides comprehensive documentation for all type definitions used throughout the GodWear email service platform. All types follow AI-First design principles with file-local schemas and complete self-containment.

## Core Email Types

### Email Service Types

#### BaseEmailService

```typescript
abstract class BaseEmailService {
  abstract readonly serviceName: string;
  protected env: any;
  protected logger: Logger;

  abstract initialize(dependencies: ServiceDependencies): void;
  abstract sendRawEmail(options: RawEmailOptions): Promise<EmailResult>;
  abstract sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult>;
  abstract resendEmail(emailId: string, options?: ResendOptions): Promise<EmailResult>;
  abstract getHealth(): Promise<ServiceHealth>;
}
```

#### EmailResult

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string;
  timestamp: string;
  provider: string;
  recipient: string;
  subject?: string;
  templateName?: string;
  error?: string;
  status?: string;
}
```

#### EmailRecipient

```typescript
interface EmailRecipient {
  email: string;
  name?: string;
}
```

### Email Options Types

#### RawEmailOptions

```typescript
interface RawEmailOptions {
  recipient: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  replyTo?: EmailRecipient;
}
```

#### TemplatedEmailOptions

```typescript
interface TemplatedEmailOptions {
  recipient: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  templateName: string;
  data: Record<string, unknown>;
  attachments?: EmailAttachment[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  replyTo?: EmailRecipient;
}
```

#### EmailAttachment

```typescript
interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}
```

## Queue Service Types

### QueueItem

```typescript
interface QueueItem {
  id: string;
  type: 'raw' | 'templated';
  options: any;
  priority: EmailPriority;
  attempts: number;
  maxAttempts: number;
  nextAttempt: number;
  createdAt: number;
  scheduledFor: number;
  status: QueueItemStatus;
  error?: string;
  result?: EmailResult;
  tags?: string[];
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}
```

#### EmailPriority

```typescript
type EmailPriority = 'low' | 'medium' | 'high' | 'critical';
```

#### QueueItemStatus

```typescript
type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
```

### Queue Options

#### QueueOptions

```typescript
interface QueueOptions {
  maxConcurrency: number;
  defaultPriority: EmailPriority;
  retryAttempts: number;
  retryDelay: number;
  rateLimit: Record<EmailPriority, number>;
  cleanupInterval: number;
  persistenceInterval: number;
  maxQueueSize: number;
}
```

#### EnqueueOptions

```typescript
interface EnqueueOptions {
  priority?: EmailPriority;
  scheduledFor?: number;
  maxAttempts?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}
```

## Analytics Types

### EmailEvent

```typescript
interface EmailEvent {
  id: string;
  type: EmailEventType;
  timestamp: number;
  userId?: string;
  recipientEmail: string;
  campaignId?: string;
  templateName?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
}
```

#### EmailEventType

```typescript
type EmailEventType = 
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed';
```

### EmailMetrics

```typescript
interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplaints: number;
  totalUnsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  groupBy?: Record<string, EmailMetrics>;
}
```

### Analytics Query Types

#### EventQuery

```typescript
interface EventQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  recipientEmail?: string;
  campaignId?: string;
  templateName?: string;
  eventTypes?: EmailEventType[];
  limit?: number;
  offset?: number;
}
```

#### MetricFilters

```typescript
interface MetricFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  recipientEmail?: string;
  campaignId?: string;
  templateName?: string;
  groupBy?: 'campaign' | 'template' | 'user' | 'date';
}
```

## Service Configuration Types

### ServiceDependencies

```typescript
interface ServiceDependencies {
  env: CloudflareBindings;
  logger: Logger;
  kv?: KVNamespace;
  db?: D1Database;
  queue?: Queue;
}
```

### ServiceHealth

```typescript
interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
  version?: string;
  dependencies?: Record<string, ServiceHealth>;
  uptime?: number;
}
```

## Template Types

### TemplateData

```typescript
interface TemplateData {
  // User information
  user?: {
    name?: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  // Order information
  order?: {
    id: string;
    number: string;
    total: number;
    currency: string;
    items: OrderItem[];
    shippingAddress?: Address;
    billingAddress?: Address;
  };

  // Branding
  branding?: {
    logoUrl?: string;
    companyName?: string;
    supportEmail?: string;
    websiteUrl?: string;
  };

  // Custom data
  [key: string]: unknown;
}
```

#### OrderItem

```typescript
interface OrderItem {
  name: string;
  variant?: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}
```

#### Address

```typescript
interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

## API Response Types

### APIResponse

```typescript
type APIResponse<T> = 
  | {
      success: true;
      data: T;
      meta?: ResponseMeta;
    }
  | {
      success: false;
      error: APIError;
    };
```

#### APIError

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  service?: string;
}
```

#### ResponseMeta

```typescript
interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
  pagination?: PaginationMeta;
}
```

#### PaginationMeta

```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

## Cloudflare Bindings

### CloudflareBindings

```typescript
interface CloudflareBindings {
  // Environment variables
  NODE_ENV: string;
  LOG_LEVEL: string;
  
  // Email service configuration
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
  EMAIL_REPLY_TO: string;
  EMAIL_SUPPORT_ADDRESS: string;
  
  // MailerSend configuration
  MAILERSEND_API_KEY: string;
  MAILERSEND_FROM_EMAIL: string;
  MAILERSEND_FROM_NAME: string;
  MAILERSEND_WEBHOOK_SECRET: string;
  
  // Application URLs
  BASE_URL: string;
  LOGO_URL: string;
  SUPPORT_EMAIL: string;
  
  // Cloudflare resources
  KV?: KVNamespace;
  DB?: D1Database;
  QUEUE?: Queue;
  
  // Additional environment variables
  [key: string]: string | KVNamespace | D1Database | Queue | undefined;
}
```

## Zod Schema Types

### Schema Inference Pattern

```typescript
// Define schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  createdAt: z.string().datetime(),
});

// Infer type
type User = z.infer<typeof UserSchema>;
```

### Common Schema Patterns

#### Email Validation

```typescript
const EmailSchema = z.string().email({});
```

#### Union Types

```typescript
const StatusSchema = z.union([
  z.literal('pending'),
  z.literal('processing'),
  z.literal('completed'),
  z.literal('failed'),
], {});
```

#### Discriminated Unions

```typescript
const ResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.unknown(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
], {});
```

## File-Local Schema Pattern

### Implementation Example

```typescript
// app/emails/services/example-service.ts

// Local environment schema
const LocalEnvSchema = z.object({
  API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email({}),
  // ... other local env vars
});

// Local options schema
const LocalOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email({}),
    name: z.string().optional(),
  }),
  subject: z.string(),
  // ... other options
});

// Local result schema
const LocalResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  // ... other result fields
});

// Type inference
type LocalEnv = z.infer<typeof LocalEnvSchema>;
type LocalOptions = z.infer<typeof LocalOptionsSchema>;
type LocalResult = z.infer<typeof LocalResultSchema>;

// Service implementation
export class ExampleService {
  private config!: LocalEnv;

  initialize(dependencies: ServiceDependencies): void {
    // Validate environment with local schema
    this.config = LocalEnvSchema.parse({
      API_KEY: dependencies.env['API_KEY'],
      FROM_EMAIL: dependencies.env['FROM_EMAIL'],
    });
  }

  async sendEmail(options: LocalOptions): Promise<LocalResult> {
    // Validate options with local schema
    const validatedOptions = LocalOptionsSchema.parse(options);
    
    // Implementation...
    
    // Return validated result
    return LocalResultSchema.parse({
      success: true,
      messageId: 'example-id',
    });
  }
}
```

## Type Export Guidelines

### Service Exports

```typescript
// Export main service class
export { ExampleService } from './example-service';

// Export types for external use
export type { LocalOptions, LocalResult } from './example-service';

// Re-export common types
export type { EmailRecipient, EmailResult } from '../types';
```

### Index File Pattern

```typescript
// app/emails/index.ts

// Export all services
export * from './services';

// Export all types
export type * from './types';

// Export utilities
export * from './utils';
```

## Best Practices

### Type Definition Guidelines

1. **Use File-Local Schemas**: Define Zod schemas locally in each file
2. **Infer Types**: Use `z.infer<typeof Schema>` for type inference
3. **Validate at Boundaries**: Validate data at service boundaries
4. **Export Selectively**: Only export types that are needed externally
5. **Document Complex Types**: Provide JSDoc comments for complex interfaces

### Schema Validation

1. **Validate Early**: Validate inputs as early as possible
2. **Use Strict Schemas**: Prefer strict validation over loose schemas
3. **Handle Errors**: Provide meaningful error messages
4. **Cache Parsed Results**: Avoid re-parsing the same data
5. **Use Discriminated Unions**: For complex result types

### Performance Considerations

1. **Lazy Schema Creation**: Create schemas lazily when possible
2. **Reuse Schemas**: Don't recreate schemas unnecessarily
3. **Optimize Validation**: Use efficient validation patterns
4. **Cache Type Guards**: Cache expensive type checking operations

This comprehensive type system ensures type safety throughout the GodWear email service platform while maintaining the AI-First design principles of file-local schemas and complete self-containment.
