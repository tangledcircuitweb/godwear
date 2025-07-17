# Zod Utilities for GodWear

This directory contains utilities and examples for using Zod in the GodWear project, following the AI-first codebase principles.

## Overview

Zod is a TypeScript-first schema validation library that allows you to define schemas for your data and automatically generate TypeScript types from those schemas. This approach ensures runtime type safety and provides a single source of truth for both validation and type definitions.

## AI-First Codebase Principles

Following the AI-first codebase principles outlined in `docs/futureai.md`, we're moving from shared type files to file-local types with Zod schemas. This means:

1. Each file defines its own types locally using Zod schemas
2. No shared type files or type imports between files
3. Runtime validation using Zod for all external data
4. Self-contained files that tell their complete story

## How to Use Zod in GodWear

### Basic Schema Definition

```typescript
// Define a schema for your data
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
});

// Infer TypeScript type from the schema
type User = z.infer<typeof userSchema>;
```

### API Response Schema

For API responses, use the discriminated union pattern:

```typescript
// Define your data schema
const userDataSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Create a response schema
const responseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    data: userDataSchema,
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
]);

// Infer the response type
type UserResponse = z.infer<typeof responseSchema>;
```

### Validation in API Routes

For Hono routes, use the zValidator middleware:

```typescript
import { zValidator } from "@hono/zod-validator";

// Define your schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Use in a route
app.post('/api/users', zValidator('json', createUserSchema), async (c) => {
  // The request body is validated and typed
  const data = c.req.valid('json');
  
  // No need for additional validation
  const user = await createUser(data);
  
  return c.json({ success: true, data: user });
});
```

### Database Entities

For database entities, define schemas that match your database structure:

```typescript
// Base record schema for all entities
const baseRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// User entity schema
const userEntitySchema = baseRecordSchema.extend({
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["user", "admin"]),
});

// Infer the entity type
type UserEntity = z.infer<typeof userEntitySchema>;
```

### Parsing External Data

Always validate external data using your schemas:

```typescript
function processUserData(data: unknown): User {
  // This will throw if validation fails
  return userSchema.parse(data);
}

// Or use safeParse for error handling
function safeProcessUserData(data: unknown): { success: boolean; data?: User; error?: z.ZodError } {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
```

## Examples

See `zod-examples.ts` for more examples of how to use Zod in various scenarios.

## Best Practices

1. **Define schemas at the top of your file** before any implementation code
2. **Use z.infer<typeof Schema>** to generate TypeScript types from your schemas
3. **Always validate external data** using your schemas
4. **Use descriptive error messages** in your schema definitions
5. **Keep schemas focused** on the specific needs of each file
6. **Use refinements** for complex validation rules
7. **Use transformations** to normalize data during validation

## Resources

- [Zod Documentation](https://zod.dev/)
- [Hono Zod Validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
