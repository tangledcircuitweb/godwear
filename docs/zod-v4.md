# Zod v4 Quick Reference

This document provides a quick reference for Zod v4 usage in the GodWear project. For a complete migration guide, see [zod-v4-migration.md](./zod-v4-migration.md).

## Key Improvements

- **Performance**: 14x faster string parsing, 7x faster array parsing, 6.5x faster object parsing
- **TypeScript Efficiency**: 100x reduction in TypeScript instantiations
- **Bundle Size**: 2x reduction in core bundle size (from 12.47kb to 5.36kb gzipped)
- **New Features**: Metadata and registries, JSON Schema support

## Common Patterns in GodWear

### Email Validation

```typescript
// Zod v4
z.email({})
```

### Union Types

```typescript
// Zod v4
z.union([z.string(), z.number()], {})
```

### Discriminated Unions

```typescript
// Zod v4
z.discriminatedUnion("success", [successSchema, errorSchema], {})
```

### Record Types

```typescript
// Zod v4
z.record(z.string(), z.unknown())
```

### OpenAPI Integration

```typescript
// Import from @hono/zod-openapi
import { z } from '@hono/zod-openapi';

// Add OpenAPI metadata
const userSchema = z.object({
  id: z.string().uuid({}).openapi({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  name: z.string().min(1, {}).openapi({
    example: 'John Doe'
  }),
}, {});
```

## Learn More

- [Zod v4 Documentation](https://zod.dev/v4)
- [OpenAPI Integration](./openapi.md)
- [API Development Guidelines](./api-development-guidelines.md)
