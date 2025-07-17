import { Hono } from "hono";
import type { CloudflareBindings } from "../../../../types/cloudflare";
declare const app: Hono<{
    Bindings: CloudflareBindings;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=callback.d.ts.map