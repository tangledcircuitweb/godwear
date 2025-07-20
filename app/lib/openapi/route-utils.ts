import { createRoute as createHonoRoute } from 'honox/factory';
import { createRoute as createOpenAPIRoute } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { ZodTypeAny } from 'zod';
import type { Context } from 'hono';
import type { CloudflareBindings } from '../zod-utils';

/**
 * Options for registering an OpenAPI route
 */
export interface OpenAPIRouteOptions<
  ParamsType extends ZodTypeAny = ZodTypeAny,
  QueryType extends ZodTypeAny = ZodTypeAny,
  BodyType extends ZodTypeAny = ZodTypeAny,
> {
  /** Route path with OpenAPI path parameters (e.g., /users/{id}) */
  path: string;
  
  /** HTTP method */
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  
  /** OpenAPI tags for categorizing the route */
  tags?: string[];
  
  /** Summary of what the route does */
  summary?: string;
  
  /** Detailed description of the route */
  description?: string;
  
  /** Unique operation ID for the route */
  operationId?: string;
  
  /** Security requirements for the route */
  security?: { [key: string]: string[] }[];
  
  /** Request parameters */
  request?: {
    /** Path parameters schema */
    params?: ParamsType;
    
    /** Query parameters schema */
    query?: QueryType;
    
    /** Request body schema */
    body?: {
      content: {
        'application/json': {
          schema: BodyType;
        };
      };
      required?: boolean;
    };
  };
  
  /** Response definitions */
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: ZodTypeAny;
        };
      };
    };
  };
  
  /** Middleware to apply to the route */
  middleware?: any[];
  
  /** Whether to hide the route from OpenAPI documentation */
  hide?: boolean;
}

/**
 * Convert existing route to OpenAPI route
 * 
 * This function registers a route with the OpenAPIHono app and returns a Hono route
 * for backward compatibility.
 * 
 * @param app OpenAPIHono app instance
 * @param options OpenAPI route options
 * @param handler Route handler
 * @returns A Hono route for backward compatibility
 */
export function registerOpenAPIRoute<
  ParamsType extends ZodTypeAny = ZodTypeAny,
  QueryType extends ZodTypeAny = ZodTypeAny,
  BodyType extends ZodTypeAny = ZodTypeAny,
>(
  app: OpenAPIHono<{ Bindings: CloudflareBindings }>,
  options: OpenAPIRouteOptions<ParamsType, QueryType, BodyType>,
  handler: (c: Context<{ Bindings: CloudflareBindings }>) => Promise<Response> | Response,
  errorHandler?: (result: { success: boolean, error?: any }, c: Context<{ Bindings: CloudflareBindings }>) => Response | undefined
) {
  // Create the route with proper type handling
  const route = createOpenAPIRoute({
    method: options.method.toUpperCase() as any,
    path: options.path,
    tags: options.tags ?? [],
    summary: options.summary ?? '',
    description: options.description ?? '',
    operationId: options.operationId ?? `${options.method}${options.path.replace(/[^a-zA-Z0-9]/g, '')}`,
    security: options.security ?? [],
    request: options.request as any, // Type cast to avoid TypeScript error
    responses: options.responses,
    middleware: options.middleware ?? [],
    hide: options.hide ?? false,
  } as any); // Type cast to avoid TypeScript errors

  // Register route with OpenAPIHono app
  if (errorHandler) {
    app.openapi(route, handler, errorHandler);
  } else {
    app.openapi(route, handler);
  }
  
  // Return Hono route for backward compatibility
  return createHonoRoute(handler);
}

/**
 * Convert OpenAPI path to Hono path
 * 
 * OpenAPI uses {param} syntax for path parameters, while Hono uses :param syntax.
 * This function converts an OpenAPI path to a Hono path.
 * 
 * @param openAPIPath OpenAPI path with {param} syntax
 * @returns Hono path with :param syntax
 */
export function convertOpenAPIPathToHonoPath(openAPIPath: string): string {
  return openAPIPath.replace(/{([^}]+)}/g, ':$1');
}

/**
 * Convert Hono path to OpenAPI path
 * 
 * Hono uses :param syntax for path parameters, while OpenAPI uses {param} syntax.
 * This function converts a Hono path to an OpenAPI path.
 * 
 * @param honoPath Hono path with :param syntax
 * @returns OpenAPI path with {param} syntax
 */
export function convertHonoPathToOpenAPIPath(honoPath: string): string {
  return honoPath.replace(/:([^/]+)/g, '{$1}');
}

/**
 * Create a standard error handler for OpenAPI routes
 * 
 * @param serviceName Name of the service for error reporting
 * @returns An error handler function for OpenAPI routes
 */
export function createOpenAPIErrorHandler(serviceName: string) {
  return (result: { success: boolean, error?: any }, c: Context<{ Bindings: CloudflareBindings }>) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.error.format(),
            timestamp: new Date().toISOString(),
            service: serviceName,
          },
        },
        422
      );
    }
    return undefined;
  };
}
