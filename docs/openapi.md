# OpenAPI Integration in GodWear

This document outlines how OpenAPI is integrated into the GodWear project using Zod OpenAPI.

## Overview

GodWear uses the `@hono/zod-openapi` package to provide OpenAPI documentation and validation for its API endpoints. This integration enables:

1. **Interactive API Documentation**: Available at `/api/docs/ui` (Swagger UI)
2. **JSON OpenAPI Specification**: Available at `/api/docs`
3. **Request Validation**: Using Zod schemas with OpenAPI extensions
4. **Response Documentation**: Standardized API responses with proper documentation

## Core Components

### 1. OpenAPI Configuration

Located at `/app/lib/openapi/config.ts`, this file contains the base OpenAPI configuration:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import type { OpenAPIOptions } from '@hono/zod-openapi';

export const createOpenAPIConfig = (c?: any): OpenAPIOptions => {
  const baseUrl = c ? new URL(c.req.url).origin : 'https://api.godwear.app';
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'GodWear API',
      version: '1.0.0',
      description: 'API for GodWear application',
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current environment',
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
  };
};

export const registerSecuritySchemes = (app: OpenAPIHono) => {
  app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
  });
};
```

### 2. Common Schema Definitions

Located at `/app/lib/openapi/schemas.ts`, this file contains common schema definitions used across the API:

```typescript
import { z } from '@hono/zod-openapi';

// API Error Schema
export const apiErrorSchema = z.object({
  code: z.string().openapi({
    example: 'VALIDATION_ERROR',
  }),
  message: z.string().openapi({
    example: 'Invalid request data',
  }),
  details: z.record(z.string(), z.unknown()).optional().openapi({
    example: { field: 'email', message: 'Invalid email format' },
  }),
}, {});

// Response Metadata Schema
export const responseMetaSchema = z.object({
  timestamp: z.string().datetime({}).openapi({
    example: '2025-07-20T15:00:00Z',
  }),
}, {});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int({}).positive({}).openapi({
    example: 1,
  }),
  pageSize: z.number().int({}).positive({}).openapi({
    example: 10,
  }),
  total: z.number().int({}).nonnegative({}).openapi({
    example: 100,
  }),
  totalPages: z.number().int({}).positive({}).openapi({
    example: 10,
  }),
}, {});

// Helper function to create API response schemas
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      data: dataSchema,
      meta: responseMetaSchema,
    }, {}),
    z.object({
      success: z.literal(false),
      error: apiErrorSchema,
    }, {}),
  ], {});
}

// Helper function to create paginated API response schemas
export function createPaginatedApiResponseSchema<T extends z.ZodTypeAny>(itemsSchema: T) {
  return createApiResponseSchema(
    z.object({
      items: z.array(itemsSchema, {}),
      pagination: paginationSchema,
    }, {})
  );
}
```

### 3. Route Conversion Utilities

Located at `/app/lib/openapi/route-utils.ts`, this file contains utilities for registering OpenAPI routes:

```typescript
import { Hono } from 'hono';
import { createRoute } from '@hono/zod-openapi';
import type { RouteConfig } from '@hono/zod-openapi';

// Interface for OpenAPI route options
export interface OpenAPIRouteOptions extends RouteConfig {
  handler: (c: any) => any;
}

// Function to convert OpenAPI path parameters to Hono path parameters
export function convertPathParams(path: string): string {
  return path.replace(/{([^}]+)}/g, ':$1');
}

// Function to register an OpenAPI route
export function registerOpenAPIRoute(app: Hono, options: OpenAPIRouteOptions) {
  const { handler, ...routeConfig } = options;
  
  // Create the OpenAPI route
  const route = createRoute(routeConfig);
  
  // Convert path parameters from OpenAPI {param} to Hono :param syntax
  const honoPath = convertPathParams(options.path);
  
  // Register the route with Hono
  app[options.method](honoPath, handler);
  
  // Return the route for potential further configuration
  return route;
}
```

### 4. OpenAPI Documentation Endpoint

Located at `/app/routes/api/docs.ts`, this file sets up the OpenAPI documentation endpoints:

```typescript
import { Hono } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { createOpenAPIConfig, registerSecuritySchemes } from '../../lib/openapi/config';

// Create the OpenAPI app
const app = new OpenAPIHono();

// Register security schemes
registerSecuritySchemes(app);

// Set up the JSON documentation endpoint
app.doc('/api/docs', (c) => createOpenAPIConfig(c));

// Set up the Swagger UI endpoint
app.get('/api/docs/ui', swaggerUI({ url: '/api/docs' }));

export default app;
```

## Using OpenAPI in API Routes

### Example API Route

```typescript
import { z } from '@hono/zod-openapi';
import { registerOpenAPIRoute } from '../../lib/openapi/route-utils';
import { createApiResponseSchema } from '../../lib/openapi/schemas';

// Define schemas
const userSchema = z.object({
  id: z.string().uuid({}).openapi({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  name: z.string().min(1, {}).openapi({
    example: 'John Doe'
  }),
  email: z.email({}).openapi({
    example: 'john@example.com'
  }),
}, {});

const createUserRequestSchema = z.object({
  name: z.string().min(1, {}).openapi({
    example: 'John Doe'
  }),
  email: z.email({}).openapi({
    example: 'john@example.com'
  }),
}, {});

// Create response schema
const userResponseSchema = createApiResponseSchema(userSchema);

// Define route
export default function usersRoutes(app) {
  // POST /api/users
  registerOpenAPIRoute(app, {
    method: 'post',
    path: '/api/users',
    tags: ['Users'],
    summary: 'Create a new user',
    description: 'Creates a new user with the provided information',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createUserRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User created successfully',
        content: {
          'application/json': {
            schema: userResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: userResponseSchema,
          },
        },
      },
    },
    handler: async (c) => {
      try {
        const data = await c.req.json();
        const validatedData = createUserRequestSchema.parse(data);
        
        // Implementation logic...
        
        return c.json({
          success: true,
          data: newUser,
          meta: { timestamp: new Date().toISOString() },
        }, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid user data',
              details: error.errors,
            }
          }, 400);
        }
        
        return c.json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create user',
          }
        }, 500);
      }
    },
  });

  return app;
}
```

## Path Parameter Handling

OpenAPI uses `{param}` syntax for path parameters, while Hono uses `:param`. Our `registerOpenAPIRoute` utility handles this conversion:

```typescript
// OpenAPI path
const path = '/api/users/{userId}';

// Converted to Hono path
const honoPath = '/api/users/:userId';
```

## Testing OpenAPI Documentation

You can test the OpenAPI documentation by:

1. Starting the development server: `npm run dev`
2. Accessing the Swagger UI at: `http://localhost:8787/api/docs/ui`
3. Accessing the JSON documentation at: `http://localhost:8787/api/docs`

## Best Practices

1. **Complete Documentation**: Include detailed descriptions, examples, and tags in your OpenAPI metadata
2. **Consistent Response Format**: Always use the standardized response format with `success`, `data`, and `meta` properties
3. **Explicit Validation**: Always validate request data explicitly using Zod schemas
4. **Error Handling**: Use standardized error responses with appropriate status codes

For more detailed guidelines on API development with OpenAPI, see [`api-development-guidelines.md`](./api-development-guidelines.md).

## References

- [Hono Zod OpenAPI Documentation](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev/)
