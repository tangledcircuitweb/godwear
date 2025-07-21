import { OpenAPIHono } from '@hono/zod-openapi';
import type { CloudflareBindings } from '../zod-utils';
/**
 * OpenAPI document base configuration
 */
export declare const openAPIConfig: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            url: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            BearerAuth: {
                type: string;
                scheme: string;
            };
        };
    };
};
/**
 * Create OpenAPIHono app with default validation error handler
 *
 * @returns OpenAPIHono app instance with CloudflareBindings
 */
export declare const createOpenAPIApp: () => OpenAPIHono<{
    Bindings: CloudflareBindings;
}, {}, "/">;
//# sourceMappingURL=config.d.ts.map