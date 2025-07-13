import { jsxRenderer } from "hono/jsx-renderer";

export default jsxRenderer(({ children, ...props }) => {
  // Extract title from props if it exists
  const title = (props as { title?: string }).title || "GodWear";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {import.meta.env.PROD ? (
          <script type="module" src="/static/client.js" />
        ) : (
          <script type="module" src="/app/client.ts" />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
});
