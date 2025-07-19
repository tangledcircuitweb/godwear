import { Hono } from "hono";
import type { CloudflareBindings } from "../../../lib/zod-utils";
declare const app: Hono<{
    Bindings: CloudflareBindings;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=logout.d.ts.map