import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { EmailAnalyticsService } from "./email-analytics-service";
import type { CloudflareBindings } from "../../lib/zod-utils";

/**
 * Create API routes for email analytics
 */
export function createAnalyticsRoutes(analyticsService: EmailAnalyticsService) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * Get email events
   * GET /api/email-analytics/events
   */
  app.get(
    "/events",
    zValidator("query", z.object({
      startDate: z.string(),
      endDate: z.string().optional(),
      userId: z.string().optional(),
      recipientEmail: z.string().optional(),
      eventTypes: z.string().optional(),
      campaignId: z.string().optional(),
      templateName: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }, {})),
    async (c) => {
      try {
        const query = c.req.valid("query");
        
        // Parse event types if provided
        const eventTypes = query.eventTypes ? query.eventTypes.split(",") : undefined;
        
        // Parse limit and offset if provided
        const limit = query.limit ? parseInt(query.limit, 10) : undefined;
        const offset = query.offset ? parseInt(query.offset, 10) : undefined;
        
        const result = await analyticsService.queryEvents({
          startDate: query.startDate,
          endDate: query.endDate,
          userId: query.userId,
          recipientEmail: query.recipientEmail,
          eventTypes: eventTypes as any,
          campaignId: query.campaignId,
          templateName: query.templateName,
          limit,
          offset,
        });
        
        return c.json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Failed to get email events", error);
        
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
      }
    }
  );

  /**
   * Get email metrics
   * GET /api/email-analytics/metrics
   */
  app.get(
    "/metrics",
    zValidator("query", z.object({
      startDate: z.string(),
      endDate: z.string().optional(),
      userId: z.string().optional(),
      recipientEmail: z.string().optional(),
      campaignId: z.string().optional(),
      templateName: z.string().optional(),
      groupBy: z.string().optional(),
    }, {})),
    async (c) => {
      try {
        const query = c.req.valid("query");
        
        const result = await analyticsService.getMetrics({
          startDate: query.startDate,
          endDate: query.endDate,
          userId: query.userId,
          recipientEmail: query.recipientEmail,
          campaignId: query.campaignId,
          templateName: query.templateName,
          groupBy: query.groupBy as any,
        });
        
        return c.json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Failed to get email metrics", error);
        
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
      }
    }
  );

  /**
   * Get email service health
   * GET /api/email-analytics/health
   */
  app.get("/health", async (c) => {
    try {
      const health = await analyticsService.getHealth();
      
      return c.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error("Failed to get email analytics health", error);
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  });

  return app;
}
