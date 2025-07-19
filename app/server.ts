// Apply Zod v4 compatibility patch
import { ensureZodPatchIsApplied } from "./lib/zod-patch";
ensureZodPatchIsApplied();

import { createApp } from "honox/server";

const app = createApp();

export default app;
