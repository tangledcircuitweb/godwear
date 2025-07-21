import { createRoute as createHonoRoute } from 'honox/factory';
import { createRoute as createOpenAPIRoute } from '@hono/zod-openapi';
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
export function registerOpenAPIRoute(app, options, handler, errorHandler) {
    // Create the route with proper type handling
    const route = createOpenAPIRoute({
        method: options.method.toUpperCase(),
        path: options.path,
        tags: options.tags ?? [],
        summary: options.summary ?? '',
        description: options.description ?? '',
        operationId: options.operationId ?? `${options.method}${options.path.replace(/[^a-zA-Z0-9]/g, '')}`,
        security: options.security ?? [],
        request: options.request, // Type cast to avoid TypeScript error
        responses: options.responses,
        middleware: options.middleware ?? [],
        hide: options.hide ?? false,
    }); // Type cast to avoid TypeScript errors
    // Register route with OpenAPIHono app
    if (errorHandler) {
        app.openapi(route, handler, errorHandler);
    }
    else {
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
export function convertOpenAPIPathToHonoPath(openAPIPath) {
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
export function convertHonoPathToOpenAPIPath(honoPath) {
    return honoPath.replace(/:([^/]+)/g, '{$1}');
}
/**
 * Create a standard error handler for OpenAPI routes
 *
 * @param serviceName Name of the service for error reporting
 * @returns An error handler function for OpenAPI routes
 */
export function createOpenAPIErrorHandler(serviceName) {
    return (result, c) => {
        if (!result.success) {
            return c.json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: result.error.format(),
                    timestamp: new Date().toISOString(),
                    service: serviceName,
                },
            }, 422);
        }
        return undefined;
    };
}
//# sourceMappingURL=route-utils.js.map