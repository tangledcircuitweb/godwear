import type { NotFoundHandler } from "hono";

const handler: NotFoundHandler = (c) => {
  return c.render(
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist.</p>
    </div>
  );
};

export default handler;
