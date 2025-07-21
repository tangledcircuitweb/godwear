# GodWear - HonoX Cloudflare Workers Application

## Quick Start

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

## Development

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Zod v4 Integration

GodWear uses Zod v4 for schema validation:

```ts
// Import directly from zod
import { z } from 'zod';

// Create API response schemas with proper discriminated union
const userResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    data: userSchema,
    meta: responseMetaSchema,
  }),
  z.object({
    success: z.literal(false),
    error: apiErrorSchema,
  }),
], {});
```

Key Zod v4 patterns used in GodWear:
- `z.email({})` - Email validation with required empty options object
- `z.union([...], {})` - Union with required options object
- `z.discriminatedUnion(discriminator, [...], {})` - Discriminated union with required options
- `z.record(z.string(), z.unknown())` - Record with key and value type parameters

See [`docs/zod-v4-migration.md`](./docs/zod-v4-migration.md) for complete migration guide.

## Testing

GodWear includes a comprehensive testing system with automatic cleanup for live Cloudflare resources.

> **Security Note:** There are known vulnerabilities in the Miniflare v2 testing dependencies. These are development-only dependencies and do not affect production deployments. We plan to upgrade to Miniflare v4 in a future update.

### Test Commands

```bash
# Unit/Integration tests (with mocks)
npm run test
npm run test:ui
npm run test:coverage

# Live Cloudflare service tests
npm run test:live:run
npm run test:live:kv

# Manual cleanup (if needed)
npm run cleanup-tests

# E2E tests
npm run test:e2e
```

### 🧹 Test Cleanup System

**Automatic cleanup** prevents resource conflicts and cost accumulation:
- ✅ Unique resource naming per test run
- ✅ Automatic cleanup after tests complete
- ✅ Manual cleanup script for emergencies
- ✅ Production resource protection

See [`docs/test-cleanup-system.md`](./docs/test-cleanup-system.md) for complete documentation.

## Documentation

- [`docs/api-development-guidelines.md`](./docs/api-development-guidelines.md) - API development standards
- [`docs/openapi.md`](./docs/openapi.md) - OpenAPI integration details
- [`docs/api-structure.md`](./docs/api-structure.md) - API route organization
- [`docs/testing-strategy.md`](./docs/testing-strategy.md) - Comprehensive testing approach
- [`docs/test-cleanup-system.md`](./docs/test-cleanup-system.md) - Resource cleanup system
- [`docs/current-testing-infrastructure.md`](./docs/current-testing-infrastructure.md) - Current test status
- [`docs/mailersend-integration.md`](./docs/mailersend-integration.md) - Email service integration
- [`docs/zod-v4-migration.md`](./docs/zod-v4-migration.md) - Zod v4 migration guide
- [`docs/futureai.md`](./docs/futureai.md) - AI-first design principles
