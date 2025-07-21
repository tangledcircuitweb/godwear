import type { OpenAPIHono } from '@hono/zod-openapi';
import type { ZodTypeAny } from 'zod';
import type { Context } from 'hono';
import type { CloudflareBindings } from '../zod-utils';
/**
 * Options for registering an OpenAPI route
 */
export interface OpenAPIRouteOptions<ParamsType extends ZodTypeAny = ZodTypeAny, QueryType extends ZodTypeAny = ZodTypeAny, BodyType extends ZodTypeAny = ZodTypeAny> {
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
    security?: {
        [key: string]: string[];
    }[];
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
export declare function registerOpenAPIRoute<ParamsType extends ZodTypeAny = ZodTypeAny, QueryType extends ZodTypeAny = ZodTypeAny, BodyType extends ZodTypeAny = ZodTypeAny>(app: OpenAPIHono<{
    Bindings: CloudflareBindings;
}>, options: OpenAPIRouteOptions<ParamsType, QueryType, BodyType>, handler: (c: Context<{
    Bindings: CloudflareBindings;
}>) => Promise<Response> | Response, errorHandler?: (result: {
    success: boolean;
    error?: any;
}, c: Context<{
    Bindings: CloudflareBindings;
}>) => Response | undefined): [import("hono/types").H<{
    Bindings: CloudflareBindings;
}, any, {}, Response | Promise<Response>>];
/**
 * Convert OpenAPI path to Hono path
 *
 * OpenAPI uses {param} syntax for path parameters, while Hono uses :param syntax.
 * This function converts an OpenAPI path to a Hono path.
 *
 * @param openAPIPath OpenAPI path with {param} syntax
 * @returns Hono path with :param syntax
 */
export declare function convertOpenAPIPathToHonoPath(openAPIPath: string): string;
/**
 * Convert Hono path to OpenAPI path
 *
 * Hono uses :param syntax for path parameters, while OpenAPI uses {param} syntax.
 * This function converts a Hono path to an OpenAPI path.
 *
 * @param honoPath Hono path with :param syntax
 * @returns OpenAPI path with {param} syntax
 */
export declare function convertHonoPathToOpenAPIPath(honoPath: string): string;
/**
 * Create a standard error handler for OpenAPI routes
 *
 * @param serviceName Name of the service for error reporting
 * @returns An error handler function for OpenAPI routes
 */
export declare function createOpenAPIErrorHandler(serviceName: string): (result: {
    success: boolean;
    error?: any;
}, c: Context<{
    Bindings: CloudflareBindings;
}>) => (Response & import("hono").TypedResponse<{
    success: false;
    error: {
        code: string;
        message: string;
        details: any;
        timestamp: string;
        service: string;
    };
}, 422, "json">) | undefined;
//# sourceMappingURL=route-utils.d.ts.map