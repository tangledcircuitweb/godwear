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
openAPIApp.get('/api/docs/ui', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GodWear API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = function() {
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
            deepLinking: true
          });
        }
      </script>
    </body>
    </html>
  `);
});

/**
 * Export the OpenAPI documentation route
 * 
 * This route will be used by the HonoX router to serve the OpenAPI documentation.
 */
export default createRoute(async (c) => {
  return openAPIApp.fetch(c.req.raw, c.env);
});
