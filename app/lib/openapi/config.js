import { OpenAPIHono } from '@hono/zod-openapi';
/**
 * OpenAPI document base configuration
 */
export const openAPIConfig = {
    openapi: '3.0.0',
    info: {
        title: 'GodWear API',
        version: '1.0.0',
        description: 'API documentation for the GodWear application',
        contact: {
            name: 'GodWear Team',
            url: 'https://github.com/tangled/godwear',
        },
    },
    servers: [
        {
            url: 'https://api.godwear.app',
            description: 'Production server',
        },
        {
            url: 'http://localhost:8787',
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
            },
        },
    },
};
/**
 * Create OpenAPIHono app with default validation error handler
 *
 * @returns OpenAPIHono app instance with CloudflareBindings
 */
export const createOpenAPIApp = () => {
    return new OpenAPIHono({
        defaultHook: (result, c) => {
            if (!result.success) {
                return c.json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        details: result.error.format(),
                        timestamp: new Date().toISOString(),
                        service: 'api-validation',
                    },
                }, 422);
            }
            return undefined;
        },
    });
};
//# sourceMappingURL=config.js.map