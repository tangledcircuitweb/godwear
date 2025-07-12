import { createApp } from 'honox/server';
import { GodWearSession } from './durable-objects/GodWearSession';

const app = createApp();

// Export Durable Object for Cloudflare Workers
export { GodWearSession };

export default app;
