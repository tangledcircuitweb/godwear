import type { ErrorHandler } from "hono";

const handler: ErrorHandler = (e, c) => {
  return c.render(
    <div>
      <h1>Error!</h1>
      <p>{e.message}</p>
    </div>
  );
};

export default handler;
