# GodWear Migration Guide

## Overview

This guide helps developers understand and adopt the architectural improvements made to GodWear during the TypeScript error resolution project. The changes establish AI-First design principles with enhanced type safety and service composition.

## Key Changes Summary

### 1. AI-First File-Local Schema Architecture
- Each file now defines its own Zod validation schemas
- Complete self-containment for better AI understanding
- Eliminated shared schema dependencies

### 2. Environment Variable Access Pattern
- Changed from `env.PROPERTY` to `env['PROPERTY']`
- Local environment validation in each service
- Strict TypeScript compliance

### 3. Service Composition Improvements
- Queue services properly wrap base email services
- Enhanced dependency injection patterns
- Consistent service initialization flow

### 4. Zod v4 Migration
- Updated to Zod v4 syntax requirements
- Required empty options objects for certain methods
- Discriminated unions for complex response types

## Migration Steps

### Step 1: Update Environment Variable Access

**Before:**
```typescript
const apiKey = env.MAILERSEND_API_KEY; // TS4111 error
const fromEmail = env.MAILERSEND_FROM_EMAIL;
```

**After:**
```typescript
// Define local environment schema
const LocalEnvSchema = z.object({
  MAILERSEND_API_KEY: z.string().min(1),
  MAILERSEND_FROM_EMAIL: z.string().email({}),
  MAILERSEND_FROM_NAME: z.string().min(1),
});

// Use bracket notation with validation
const config = LocalEnvSchema.parse({
  MAILERSEND_API_KEY: env['MAILERSEND_API_KEY'],
  MAILERSEND_FROM_EMAIL: env['MAILERSEND_FROM_EMAIL'],
  MAILERSEND_FROM_NAME: env['MAILERSEND_FROM_NAME'],
});
```

### Step 2: Implement File-Local Schemas

**Before:**
```typescript
import { EmailOptions } from '../types/email'; // Shared dependency
```

**After:**
```typescript
// Define local schema in the same file
const LocalEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email({}),
    name: z.string().optional(),
  }),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
});

type LocalEmailOptions = z.infer<typeof LocalEmailOptionsSchema>;
```

### Step 3: Update Zod v4 Syntax

**Before (Zod v3):**
```typescript
const emailSchema = z.string().email();
const statusSchema = z.enum(['pending', 'completed']);
const unionSchema = z.union([stringSchema, numberSchema]);
```

**After (Zod v4):**
```typescript
const emailSchema = z.string().email({}); // Empty options required
const statusSchema = z.enum(['pending', 'completed'], {}); // Empty options required
const unionSchema = z.union([stringSchema, numberSchema], {}); // Empty options required

// Discriminated unions for complex types
const responseSchema = z.discriminatedUnion("success", [
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

### Step 4: Update Service Composition

**Before:**
```typescript
const queueService = new EmailQueueService(); // Missing parameter
```

**After:**
```typescript
const baseService = new TransactionalEmailService();
const queueService = new EmailQueueService(baseService); // Proper composition
```

### Step 5: Handle Optional Properties

**Before:**
```typescript
interface Config {
  name?: string;
}

// This could cause TS2375 with exactOptionalPropertyTypes
const config: Config = { name: undefined };
```

**After:**
```typescript
interface Config {
  name?: string;
}

// Proper optional property handling
const config: Config = {}; // Don't assign undefined
// Or use default values
const name = config.name ?? "default";
```

## Service Migration Examples

### Email Service Migration

**Before:**
```typescript
export class EmailService {
  private apiKey: string;

  constructor(env: any) {
    this.apiKey = env.API_KEY; // TS4111 error
  }

  async sendEmail(options: any): Promise<any> {
    // Implementation
  }
}
```

**After:**
```typescript
// Local schemas
const LocalConfigSchema = z.object({
  API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email({}),
});

const LocalEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email({}),
    name: z.string().optional(),
  }),
  subject: z.string(),
  html: z.string(),
});

const LocalEmailResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  timestamp: z.string(),
});

// Type inference
type LocalConfig = z.infer<typeof LocalConfigSchema>;
type LocalEmailOptions = z.infer<typeof LocalEmailOptionsSchema>;
type LocalEmailResult = z.infer<typeof LocalEmailResultSchema>;

export class EmailService extends BaseEmailService {
  override readonly serviceName = "email-service";
  private config!: LocalConfig;

  constructor() {
    super(); // No parameters in constructor
  }

  override initialize(dependencies: ServiceDependencies): void {
    super.initialize(dependencies);
    
    // Environment validation with local schema
    this.config = LocalConfigSchema.parse({
      API_KEY: this.env['API_KEY'],
      FROM_EMAIL: this.env['FROM_EMAIL'],
    });
  }

  async sendEmail(options: LocalEmailOptions): Promise<LocalEmailResult> {
    // Validate options
    const validatedOptions = LocalEmailOptionsSchema.parse(options);
    
    // Implementation
    
    // Return validated result
    return LocalEmailResultSchema.parse({
      success: true,
      messageId: 'example-id',
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Queue Service Migration

**Before:**
```typescript
const queueService = new EmailQueueService();
```

**After:**
```typescript
// Create base service first
const baseService = new TransactionalEmailService();

// Pass to queue service
const queueService = new EmailQueueService(baseService);

// Initialize both services
const dependencies = { env, logger, kv, db };
queueService.initialize(dependencies);
```

## Testing Migration

### Test Data Updates

**Before:**
```typescript
const testData = {
  to: "test@example.com",
  subject: "Test",
  html: "<p>Test</p>",
};
```

**After:**
```typescript
const testData = {
  recipient: {
    email: "test@example.com",
    name: "Test User",
  },
  subject: "Test",
  html: "<p>Test</p>",
  text: "Test",
};
```

### Mock Service Updates

**Before:**
```typescript
const mockService = {
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
};
```

**After:**
```typescript
const mockService = {
  sendEmail: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-id',
    timestamp: new Date().toISOString(),
    provider: 'mock',
    recipient: 'test@example.com',
  }),
};
```

## Common Migration Issues

### Issue 1: TS4111 Environment Variable Access

**Problem:** `Property 'PROPERTY' comes from an index signature`

**Solution:** Use bracket notation with local validation
```typescript
// Instead of: env.PROPERTY
// Use: env['PROPERTY'] with schema validation
```

### Issue 2: TS2339 Property Does Not Exist

**Problem:** Interface mismatches after schema changes

**Solution:** Define local schemas and types
```typescript
// Define local schema instead of importing shared types
const LocalSchema = z.object({ /* local definition */ });
type LocalType = z.infer<typeof LocalSchema>;
```

### Issue 3: TS2375 Optional Property Conflicts

**Problem:** `exactOptionalPropertyTypes` conflicts

**Solution:** Proper optional property handling
```typescript
// Don't assign undefined to optional properties
// Use default values or proper checks
const value = config.optional ?? "default";
```

### Issue 4: TS2554 Function Parameter Mismatches

**Problem:** Function signatures changed during refactoring

**Solution:** Update function calls to match new signatures
```typescript
// Check constructor and method signatures
// Ensure proper parameter passing
```

## Best Practices After Migration

### 1. File Organization

- Keep schemas at the top of each file
- Group related schemas together
- Use consistent naming conventions

### 2. Schema Definition

- Define schemas locally in each file
- Use descriptive schema names with "Local" prefix
- Include proper validation rules

### 3. Type Inference

- Use `z.infer<typeof Schema>` for type inference
- Don't manually define types that can be inferred
- Keep types close to their schemas

### 4. Error Handling

- Validate data at service boundaries
- Use proper error types and messages
- Handle validation errors gracefully

### 5. Testing

- Update test data to match new schemas
- Test schema validation explicitly
- Include error case testing

## Validation Checklist

After migration, verify:

- [ ] All environment variables use bracket notation
- [ ] Each service file has local schemas
- [ ] Zod v4 syntax is used throughout
- [ ] Service composition is correct
- [ ] Optional properties are handled properly
- [ ] Tests pass with new data structures
- [ ] Type errors are resolved
- [ ] Runtime functionality is preserved

## Getting Help

If you encounter issues during migration:

1. Check the [Type Definitions](./type-definitions.md) documentation
2. Review the [Architecture Improvements](./architecture-improvements.md) guide
3. Look at existing migrated services for examples
4. Run the test suite to validate changes
5. Check the validation report for common issues

## Conclusion

The migration to AI-First architecture provides:

- **Better Type Safety**: Strict TypeScript compliance
- **Improved Maintainability**: File-local schemas and self-containment
- **Enhanced Testing**: Consistent data structures and validation
- **Future-Proof Design**: Scalable architecture patterns

Following this migration guide ensures your code aligns with the new architectural standards while maintaining functionality and improving code quality.
