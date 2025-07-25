# API Development Guidelines

This document outlines the standardized approach for developing APIs in the GodWear project, leveraging Zod v4 schemas with OpenAPI extensions and AI-First design principles established during the architectural improvements.

## Core Architecture

### 1. AI-First Schema Development with Zod v4

All API endpoints must follow an AI-First, schema-first approach using Zod v4 with file-local schemas:

```typescript
import { z } from 'zod';

// File-local schema definition (complete self-containment)
const LocalUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email({}), // Zod v4 requires empty options
  role: z.enum(['user', 'admin'], {}), // Zod v4 enum syntax
  createdAt: z.string().datetime(),
}, {});

// Local type inference
type LocalUser = z.infer<typeof LocalUserSchema>;

// Local API response schema with discriminated union
const LocalUserResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    data: LocalUserSchema,
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
], {});
```

### 2. Environment Variable Access Pattern

Follow the strict `env['PROPERTY']` pattern with local validation:

```typescript
// Local environment schema
const LocalEnvSchema = z.object({
  API_KEY: z.string().min(1),
  BASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'], {}),
});

// Usage in service
const config = LocalEnvSchema.parse({
  API_KEY: env['API_KEY'],
  BASE_URL: env['BASE_URL'],
  LOG_LEVEL: env['LOG_LEVEL'],
});
```
const createUserRequestSchema = z.object({
  name: z.string().min(1, {}).openapi({
    example: 'John Doe'
  }),
  email: z.email({}).openapi({
    example: 'john@example.com'
  }),
}, {});
```

### 2. Standardized Response Format

Use the common response schema helpers for consistent API responses:

```typescript
import { createApiResponseSchema } from '../lib/openapi/schemas';

// Create a standardized response schema
const userResponseSchema = createApiResponseSchema(userSchema);

// This generates a discriminated union type:
// {
//   success: true,
//   data: UserSchema,
//   meta: ResponseMetaSchema
// } | {
//   success: false,
//   error: ApiErrorSchema
// }
```

### 3. OpenAPI Route Registration

All API routes must use the OpenAPI registration pattern:

```typescript
import { registerOpenAPIRoute } from '../lib/openapi/route-utils';

// Define the route with OpenAPI metadata
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
    200: {
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
          schema: apiErrorResponseSchema,
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
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          }
        }, 400);
      }
      
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        }
      }, 500);
    }
  },
});
```

## Feature-Based Organization

Following our established API structure, organize routes by feature:

```
app/routes/api/
├── auth/                    # Authentication & Authorization
├── health/                  # System Health & Monitoring
├── notifications/           # Email & Push Notifications
└── users/                   # User Management
```

Each feature directory should contain:

1. Route handlers (e.g., `users.ts`, `index.ts`)
2. Feature-specific schemas (defined locally in the files where they're used)
3. Feature-specific utilities (if needed)

## AI-First Schema Design

### 1. File-Local Type Definitions

Following our AI-first principles, define all schemas and types locally in the files where they're used:

```typescript
// Define the schema locally in the file
const UserSchema = z.object({
  id: z.string().uuid({}).openapi({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  name: z.string().openapi({
    example: 'John Doe'
  }),
  email: z.email({}).openapi({
    example: 'john@example.com'
  }),
});

// Infer TypeScript type from the schema
type User = z.infer<typeof UserSchema>;
```

### 2. Schema Modularity

Design schemas to be modular and reusable within the file:

```typescript
// Base schema for common properties
const productBaseSchema = z.object({
  name: z.string().min(1, {}).openapi({
    example: 'Running Shoes'
  }),
  description: z.string().optional().openapi({
    example: 'Comfortable running shoes for all terrains'
  }),
  price: z.number().positive({}).openapi({
    example: 99.99
  }),
}, {});

// Extended for specific use cases
const productDetailSchema = productBaseSchema.extend({
  id: z.string().uuid({}).openapi({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  createdAt: z.string().datetime({}).openapi({
    example: '2025-07-20T15:00:00Z'
  }),
  updatedAt: z.string().datetime({}).openapi({
    example: '2025-07-20T15:00:00Z'
  }),
}, {});
```

### 3. Runtime Validation

Always validate external data using Zod schemas:

```typescript
try {
  const data = await c.req.json();
  const validatedData = createUserRequestSchema.parse(data);
  
  // Now safe to use validatedData
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation error
  }
}
```

## Path Parameter Handling

OpenAPI uses `{param}` syntax for path parameters, while Hono uses `:param`. Our `registerOpenAPIRoute` utility handles this conversion:

```typescript
// Define path parameters with OpenAPI syntax
const route = {
  path: '/api/users/{userId}',
  // ...
};

// The utility converts this to Hono's syntax internally
// '/api/users/:userId'
```

When defining path parameter schemas:

```typescript
const userIdParamSchema = z.object({
  userId: z.string().uuid({}).openapi({
    param: {
      name: 'userId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
}, {});
```

## Error Handling

Use standardized error responses:

```typescript
// Error schema is defined in /app/lib/openapi/schemas.ts
import { apiErrorResponseSchema } from '../lib/openapi/schemas';

// In route handlers
try {
  // Implementation logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors,
      }
    }, 400);
  }
  
  // Log the error for internal tracking
  console.error('Internal error:', error);
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }, 500);
}
```

## Testing Standards

### 1. Schema Validation Tests

Test your Zod schemas to ensure they validate correctly:

```typescript
describe('User API Schemas', () => {
  it('should validate a valid user object', () => {
    const validUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };
    
    const result = createUserRequestSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
  
  it('should reject an invalid user object', () => {
    const invalidUser = {
      name: '',
      email: 'not-an-email',
    };
    
    const result = createUserRequestSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    expect(result.error.errors.length).toBeGreaterThan(0);
  });
});
```

### 2. Route Handler Tests

Test your route handlers with the test factory:

```typescript
describe('User API Routes', () => {
  let testApp: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    testApp = createTestApp();
    // Mount your routes
  });

  it('should create a user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const res = await testApp.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({
      email: userData.email,
      name: userData.name,
    });
  });
});
```

### 3. OpenAPI Documentation Tests

Verify that your API is correctly documented:

```typescript
describe('OpenAPI Documentation', () => {
  it('should include the user creation endpoint', async () => {
    const response = await app.request('/api/docs');
    const openApiSpec = await response.json();
    
    expect(openApiSpec.paths['/api/users'].post).toBeDefined();
    expect(openApiSpec.paths['/api/users'].post.summary).toBe('Create a new user');
  });
});
```

## Development Workflow

1. **Define Schemas**: Start by defining your data schemas with Zod v4 and OpenAPI extensions
2. **Create Response Schemas**: Use the `createApiResponseSchema` helper for standardized responses
3. **Register Routes**: Use `registerOpenAPIRoute` to define routes with OpenAPI metadata
4. **Implement Handler Logic**: Write the route handler implementation with proper error handling
5. **Write Tests**: Create schema validation and route handler tests
6. **Verify Documentation**: Check that the OpenAPI documentation is correct at `/api/docs` and `/api/docs/ui`
7. **Commit Changes**: Commit with a descriptive message after tests pass

## Best Practices

1. **Complete Documentation**: Include detailed descriptions, examples, and tags in your OpenAPI metadata
2. **Consistent Response Format**: Always use the standardized response format with `success`, `data`, and `meta` properties
3. **Explicit Validation**: Always validate request data explicitly using Zod schemas
4. **Error Handling**: Use standardized error responses with appropriate status codes
5. **Path Parameter Conversion**: Remember that OpenAPI uses `{param}` syntax while Hono uses `:param` syntax
6. **File-Local Types**: Define all types and schemas locally in the files where they're used
7. **Test Coverage**: Ensure comprehensive test coverage for schemas, route handlers, and OpenAPI documentation

## Example: Complete API Endpoint

Here's a complete example of an API endpoint following these guidelines:

```typescript
import { z } from '@hono/zod-openapi';
import { registerOpenAPIRoute } from '../../lib/openapi/route-utils';
import { createApiResponseSchema } from '../../lib/openapi/schemas';

// Define schemas
const productSchema = z.object({
  id: z.string().uuid({}).openapi({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  name: z.string().min(1, {}).openapi({
    example: 'Running Shoes'
  }),
  price: z.number().positive({}).openapi({
    example: 99.99
  }),
  category: z.enum(['clothing', 'accessories', 'footwear'], {}).openapi({
    example: 'footwear'
  }),
  createdAt: z.string().datetime({}).openapi({
    example: '2025-07-20T15:00:00Z'
  }),
}, {});

const createProductRequestSchema = z.object({
  name: z.string().min(1, {}).openapi({
    example: 'Running Shoes'
  }),
  price: z.number().positive({}).openapi({
    example: 99.99
  }),
  category: z.enum(['clothing', 'accessories', 'footwear'], {}).openapi({
    example: 'footwear'
  }),
}, {});

// Create response schema
const productResponseSchema = createApiResponseSchema(productSchema);
const productsListResponseSchema = createApiResponseSchema(z.array(productSchema, {}));

// Define route
export default function productsRoutes(app) {
  // GET /api/products
  registerOpenAPIRoute(app, {
    method: 'get',
    path: '/api/products',
    tags: ['Products'],
    summary: 'List all products',
    description: 'Returns a list of all available products',
    responses: {
      200: {
        description: 'List of products',
        content: {
          'application/json': {
            schema: productsListResponseSchema,
          },
        },
      },
    },
    handler: async (c) => {
      try {
        // Implementation logic...
        const products = await getProducts();
        
        return c.json({
          success: true,
          data: products,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        
        return c.json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch products',
          }
        }, 500);
      }
    },
  });

  // POST /api/products
  registerOpenAPIRoute(app, {
    method: 'post',
    path: '/api/products',
    tags: ['Products'],
    summary: 'Create a new product',
    description: 'Creates a new product with the provided information',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createProductRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Product created successfully',
        content: {
          'application/json': {
            schema: productResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: apiErrorResponseSchema,
          },
        },
      },
    },
    handler: async (c) => {
      try {
        const data = await c.req.json();
        const validatedData = createProductRequestSchema.parse(data);
        
        // Implementation logic...
        const newProduct = await createProduct(validatedData);
        
        return c.json({
          success: true,
          data: newProduct,
          meta: { timestamp: new Date().toISOString() },
        }, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid product data',
              details: error.errors,
            }
          }, 400);
        }
        
        console.error('Error creating product:', error);
        
        return c.json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create product',
          }
        }, 500);
      }
    },
  });

  return app;
}
```

By following these guidelines, we ensure that all APIs in the GodWear project are consistently developed, well-documented, and optimized for both human and AI interactions.
