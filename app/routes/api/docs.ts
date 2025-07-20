import { createRoute } from 'honox/factory';
import { OpenAPIHono } from '@hono/zod-openapi';
import { openAPIConfig } from '../../lib/openapi/config';
import type { CloudflareBindings } from '../../lib/zod-utils';

/**
 * Create a new OpenAPIHono app for documentation
 */
const openAPIApp = new OpenAPIHono<{ Bindings: CloudflareBindings }>();

/**
 * Register OpenAPI documentation route
 * 
 * This route serves the OpenAPI documentation in JSON format.
 * It can be accessed at /api/docs
 */
openAPIApp.doc('/api/docs', (c) => ({
  ...openAPIConfig,
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: 'Current environment',
    },
    ...openAPIConfig.servers,
  ],
}));

/**
 * Register OpenAPI UI route
 * 
 * This route serves the Swagger UI for interactive API documentation.
 * It can be accessed at /api/docs/ui
 */
openAPIApp.doc('/api/docs/ui', {
  ...openAPIConfig,
  servers: [
    {
      url: '/',
      description: 'Current environment',
    },
    ...openAPIConfig.servers,
  ],
});

/**
 * Export the OpenAPI documentation route
 * 
 * This route will be used by the HonoX router to serve the OpenAPI documentation.
 */
export default createRoute(async (c) => {
  return openAPIApp.fetch(c.req.raw, c.env);
});
