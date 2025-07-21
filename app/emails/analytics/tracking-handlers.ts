import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { EmailAnalyticsService } from "./email-analytics-service";
import type { CloudflareBindings } from "../../lib/zod-utils";

/**
 * Tracking pixel query parameters schema
 */
const TrackingPixelParamsSchema = z.object({
  email_id: z.string(),
  user_id: z.string().optional(),
  campaign_id: z.string().optional(),
  template_name: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * Tracking redirect query parameters schema
 */
const TrackingRedirectParamsSchema = z.object({
  url: z.string(),
  email_id: z.string(),
  user_id: z.string().optional(),
  link_id: z.string(),
  campaign_id: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * Create tracking routes for email analytics
 */
export function createTrackingRoutes(analyticsService: EmailAnalyticsService) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * Tracking pixel endpoint for email opens
   * GET /api/tracking/pixel
   */
  app.get(
    "/pixel",
    zValidator("query", TrackingPixelParamsSchema),
    async (c) => {
      const query = c.req.valid("query");
      const userAgent = c.req.header("user-agent") || "";
      const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
      
      // Extract recipient email from headers if available
      const recipientEmail = c.req.header("x-email-recipient") || "unknown@example.com";
      
      // Track open event asynchronously (don't await)
      analyticsService.trackEvent({
        id: crypto.randomUUID(),
        emailId: query.email_id,
        userId: query.user_id,
        recipientEmail,
        eventType: "opened",
        timestamp: new Date(),
        provider: "tracking-pixel",
        campaignId: query.campaign_id,
        templateName: query.template_name,
        metadata: {
          userAgent,
          ipAddress,
          headers: Object.fromEntries(
            Object.entries(c.req.header()).filter(([key]) => 
              !key.toLowerCase().includes("cookie") && 
              !key.toLowerCase().includes("authorization")
            )
          ),
        },
      }).catch(error => {
        console.error("Failed to track open event", error);
      });
      
      // Return a 1x1 transparent pixel
      return new Response(
        Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
        {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }
  );

  /**
   * Tracking redirect endpoint for email clicks
   * GET /api/tracking/redirect
   */
  app.get(
    "/redirect",
    zValidator("query", TrackingRedirectParamsSchema),
    async (c) => {
      const query = c.req.valid("query");
      const userAgent = c.req.header("user-agent") || "";
      const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
      
      // Extract recipient email from headers if available
      const recipientEmail = c.req.header("x-email-recipient") || "unknown@example.com";
      
      // Determine device type from user agent
      let deviceType = "unknown";
      if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
        deviceType = "mobile";
      } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
        deviceType = "tablet";
      } else if (userAgent.includes("Windows") || userAgent.includes("Macintosh") || userAgent.includes("Linux")) {
        deviceType = "desktop";
      }
      
      // Track click event asynchronously (don't await)
      analyticsService.trackClickEvent({
        id: crypto.randomUUID(),
        emailId: query.email_id,
        userId: query.user_id,
        recipientEmail,
        eventType: "clicked",
        timestamp: new Date(),
        provider: "tracking-redirect",
        campaignId: query.campaign_id,
        linkId: query.link_id,
        linkUrl: decodeURIComponent(query.url),
        userAgent,
        ipAddress,
        deviceType,
      }).catch(error => {
        console.error("Failed to track click event", error);
      });
      
      // Decode and validate the URL
      let redirectUrl: string;
      try {
        redirectUrl = decodeURIComponent(query.url);
        
        // Basic URL validation
        new URL(redirectUrl);
        
        // Check for allowed domains (optional security measure)
        // const allowedDomains = ["godwear.com", "www.godwear.com"];
        // const urlDomain = new URL(redirectUrl).hostname;
        // if (!allowedDomains.some(domain => urlDomain === domain || urlDomain.endsWith(`.${domain}`))) {
        //   throw new Error("Domain not allowed");
        // }
      } catch (error) {
        // If URL is invalid, redirect to homepage
        redirectUrl = "/";
      }
      
      // Redirect to the target URL
      return c.redirect(redirectUrl, 302);
    }
  );

  /**
   * Webhook endpoint for email delivery events from email service providers
   * POST /api/tracking/webhook/:provider
   */
  app.post("/webhook/:provider", async (c) => {
    const provider = c.req.param("provider");
    const signature = c.req.header("x-webhook-signature") || "";
    const body = await c.req.json();
    
    try {
      // Verify webhook signature (implementation depends on provider)
      // if (!verifyWebhookSignature(provider, signature, body)) {
      //   return c.json({ error: "Invalid signature" }, 401);
      // }
      
      // Process events based on provider
      switch (provider) {
        case "mailersend":
          await processMailerSendWebhook(analyticsService, body);
          break;
        case "sendgrid":
          await processSendGridWebhook(analyticsService, body);
          break;
        default:
          return c.json({ error: "Unsupported provider" }, 400);
      }
      
      return c.json({ success: true });
    } catch (error) {
      console.error(`Error processing ${provider} webhook:`, error);
      return c.json({ error: "Failed to process webhook" }, 500);
    }
  });

  return app;
}

/**
 * Process MailerSend webhook events
 */
async function processMailerSendWebhook(analyticsService: EmailAnalyticsService, body: any): Promise<void> {
  // MailerSend webhook format: https://developers.mailersend.com/api/v1/webhooks.html
  
  if (!Array.isArray(body)) {
    throw new Error("Invalid webhook payload");
  }
  
  for (const event of body) {
    if (!event.type || !event.data || !event.data.message_id) {
      continue;
    }
    
    const baseEvent = {
      id: crypto.randomUUID(),
      emailId: event.data.message_id,
      recipientEmail: event.data.recipient?.email || "unknown@example.com",
      userId: event.data.tags?.user_id,
      timestamp: new Date(event.created_at || Date.now()),
      provider: "mailersend",
      campaignId: event.data.tags?.campaign_id,
      templateName: event.data.tags?.template_name,
      metadata: event.data,
    };
    
    switch (event.type) {
      case "sent":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "sent",
        });
        break;
      case "delivered":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "delivered",
        });
        break;
      case "opened":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "opened",
        });
        break;
      case "clicked":
        await analyticsService.trackClickEvent({
          ...baseEvent,
          eventType: "clicked",
          linkId: event.data.tags?.link_id || "unknown",
          linkUrl: event.data.url || "https://example.com",
        });
        break;
      case "bounced":
        await analyticsService.trackBounceEvent({
          ...baseEvent,
          eventType: "bounced",
          bounceType: event.data.reason?.includes("hard") ? "hard" : "soft",
          bounceReason: event.data.reason,
          diagnosticCode: event.data.code,
        });
        break;
      case "spam_complaint":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "complained",
        });
        break;
      case "unsubscribed":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "unsubscribed",
        });
        break;
    }
  }
}

/**
 * Process SendGrid webhook events
 */
async function processSendGridWebhook(analyticsService: EmailAnalyticsService, body: any): Promise<void> {
  // SendGrid webhook format: https://docs.sendgrid.com/for-developers/tracking-events/event
  
  if (!Array.isArray(body)) {
    throw new Error("Invalid webhook payload");
  }
  
  for (const event of body) {
    if (!event.event || !event.sg_message_id) {
      continue;
    }
    
    const baseEvent = {
      id: crypto.randomUUID(),
      emailId: event.sg_message_id,
      recipientEmail: event.email || "unknown@example.com",
      userId: event.user_id,
      timestamp: new Date(event.timestamp * 1000 || Date.now()),
      provider: "sendgrid",
      campaignId: event.campaign_id,
      templateName: event.template_id,
      metadata: event,
    };
    
    switch (event.event) {
      case "processed":
      case "sent":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "sent",
        });
        break;
      case "delivered":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "delivered",
        });
        break;
      case "open":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "opened",
        });
        break;
      case "click":
        await analyticsService.trackClickEvent({
          ...baseEvent,
          eventType: "clicked",
          linkId: event.url_offset?.toString() || "unknown",
          linkUrl: event.url || "https://example.com",
        });
        break;
      case "bounce":
        await analyticsService.trackBounceEvent({
          ...baseEvent,
          eventType: "bounced",
          bounceType: event.type === "bounce" ? "hard" : "soft",
          bounceReason: event.reason,
          diagnosticCode: event.status,
        });
        break;
      case "spamreport":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "complained",
        });
        break;
      case "unsubscribe":
        await analyticsService.trackEvent({
          ...baseEvent,
          eventType: "unsubscribed",
        });
        break;
    }
  }
}
