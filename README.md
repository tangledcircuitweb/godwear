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

## Testing

GodWear includes a comprehensive testing system with automatic cleanup for live Cloudflare resources.

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

- [`docs/testing-strategy.md`](./docs/testing-strategy.md) - Comprehensive testing approach
- [`docs/test-cleanup-system.md`](./docs/test-cleanup-system.md) - Resource cleanup system
- [`docs/current-testing-infrastructure.md`](./docs/current-testing-infrastructure.md) - Current test status
- [`docs/mailersend-integration.md`](./docs/mailersend-integration.md) - Email service integration
```
