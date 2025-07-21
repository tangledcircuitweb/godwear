import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryEmailAnalyticsService } from "./in-memory-analytics-service";

describe("InMemoryEmailAnalyticsService", () => {
  let analyticsService: InMemoryEmailAnalyticsService;

  beforeEach(() => {
    analyticsService = new InMemoryEmailAnalyticsService();
    analyticsService.initialize({
      env: {},
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
    analyticsService.clearEvents();
  });

  describe("trackEvent", () => {
    it("should track an email event", async () => {
      const event = {
        emailId: "email-123",
        recipientEmail: "user@example.com",
        eventType: "sent" as const,
        timestamp: new Date(),
        provider: "test",
      };

      await analyticsService.trackEvent(event);

      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
      });

      expect(result.totalCount).toBe(1);
      expect(result.events[0].emailId).toBe(event.emailId);
      expect(result.events[0].eventType).toBe(event.eventType);
    });

    it("should track multiple events", async () => {
      const events = [
        {
          emailId: "email-123",
          recipientEmail: "user@example.com",
          eventType: "sent" as const,
          timestamp: new Date(),
          provider: "test",
        },
        {
          emailId: "email-123",
          recipientEmail: "user@example.com",
          eventType: "delivered" as const,
          timestamp: new Date(),
          provider: "test",
        },
        {
          emailId: "email-123",
          recipientEmail: "user@example.com",
          eventType: "opened" as const,
          timestamp: new Date(),
          provider: "test",
        },
      ];

      for (const event of events) {
        await analyticsService.trackEvent(event);
      }

      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
      });

      expect(result.totalCount).toBe(3);
    });
  });

  describe("trackClickEvent", () => {
    it("should track a click event", async () => {
      const event = {
        emailId: "email-123",
        recipientEmail: "user@example.com",
        eventType: "clicked" as const,
        timestamp: new Date(),
        provider: "test",
        linkId: "link-123",
        linkUrl: "https://example.com",
      };

      await analyticsService.trackClickEvent(event);

      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        eventTypes: ["clicked"],
      });

      expect(result.totalCount).toBe(1);
      expect(result.events[0].emailId).toBe(event.emailId);
      expect(result.events[0].eventType).toBe(event.eventType);
    });
  });

  describe("trackBounceEvent", () => {
    it("should track a bounce event", async () => {
      const event = {
        emailId: "email-123",
        recipientEmail: "user@example.com",
        eventType: "bounced" as const,
        timestamp: new Date(),
        provider: "test",
        bounceType: "hard" as const,
        bounceReason: "Invalid recipient",
      };

      await analyticsService.trackBounceEvent(event);

      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        eventTypes: ["bounced"],
      });

      expect(result.totalCount).toBe(1);
      expect(result.events[0].emailId).toBe(event.emailId);
      expect(result.events[0].eventType).toBe(event.eventType);
    });
  });

  describe("queryEvents", () => {
    beforeEach(async () => {
      const events = [
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "sent" as const,
          timestamp: new Date(Date.now() - 3600000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "delivered" as const,
          timestamp: new Date(Date.now() - 3500000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "opened" as const,
          timestamp: new Date(Date.now() - 3400000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-456",
          recipientEmail: "user2@example.com",
          userId: "user-2",
          eventType: "sent" as const,
          timestamp: new Date(Date.now() - 3300000),
          provider: "test",
          campaignId: "campaign-2",
          templateName: "order-confirmation",
        },
        {
          emailId: "email-456",
          recipientEmail: "user2@example.com",
          userId: "user-2",
          eventType: "bounced" as const,
          timestamp: new Date(Date.now() - 3200000),
          provider: "test",
          campaignId: "campaign-2",
          templateName: "order-confirmation",
        },
      ];

      for (const event of events) {
        await analyticsService.trackEvent(event);
      }
    });

    it("should filter events by date range", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3450000),
        endDate: new Date(Date.now() - 3250000),
      });

      expect(result.totalCount).toBe(2);
    });

    it("should filter events by user ID", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        userId: "user-1",
      });

      expect(result.totalCount).toBe(3);
      expect(result.events.every(e => e.userId === "user-1")).toBe(true);
    });

    it("should filter events by recipient email", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        recipientEmail: "user2@example.com",
      });

      expect(result.totalCount).toBe(2);
      expect(result.events.every(e => e.recipientEmail === "user2@example.com")).toBe(true);
    });

    it("should filter events by event type", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        eventTypes: ["sent"],
      });

      expect(result.totalCount).toBe(2);
      expect(result.events.every(e => e.eventType === "sent")).toBe(true);
    });

    it("should filter events by campaign ID", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        campaignId: "campaign-1",
      });

      expect(result.totalCount).toBe(3);
      expect(result.events.every(e => e.campaignId === "campaign-1")).toBe(true);
    });

    it("should filter events by template name", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        templateName: "order-confirmation",
      });

      expect(result.totalCount).toBe(2);
      expect(result.events.every(e => e.templateName === "order-confirmation")).toBe(true);
    });

    it("should apply pagination", async () => {
      const result = await analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000),
        limit: 2,
        offset: 1,
      });

      expect(result.totalCount).toBe(5); // Total count should still be 5
      expect(result.events.length).toBe(2); // But only 2 events returned
    });
  });

  describe("getMetrics", () => {
    beforeEach(async () => {
      const events = [
        // Campaign 1
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "sent" as const,
          timestamp: new Date(Date.now() - 3600000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "delivered" as const,
          timestamp: new Date(Date.now() - 3500000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "opened" as const,
          timestamp: new Date(Date.now() - 3400000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        {
          emailId: "email-123",
          recipientEmail: "user1@example.com",
          userId: "user-1",
          eventType: "clicked" as const,
          timestamp: new Date(Date.now() - 3300000),
          provider: "test",
          campaignId: "campaign-1",
          templateName: "welcome",
        },
        
        // Campaign 2
        {
          emailId: "email-456",
          recipientEmail: "user2@example.com",
          userId: "user-2",
          eventType: "sent" as const,
          timestamp: new Date(Date.now() - 3200000),
          provider: "test",
          campaignId: "campaign-2",
          templateName: "order-confirmation",
        },
        {
          emailId: "email-456",
          recipientEmail: "user2@example.com",
          userId: "user-2",
          eventType: "bounced" as const,
          timestamp: new Date(Date.now() - 3100000),
          provider: "test",
          campaignId: "campaign-2",
          templateName: "order-confirmation",
        },
        
        // Campaign 3
        {
          emailId: "email-789",
          recipientEmail: "user3@example.com",
          userId: "user-3",
          eventType: "sent" as const,
          timestamp: new Date(Date.now() - 3000000),
          provider: "test",
          campaignId: "campaign-3",
          templateName: "password-reset",
        },
        {
          emailId: "email-789",
          recipientEmail: "user3@example.com",
          userId: "user-3",
          eventType: "delivered" as const,
          timestamp: new Date(Date.now() - 2900000),
          provider: "test",
          campaignId: "campaign-3",
          templateName: "password-reset",
        },
        {
          emailId: "email-789",
          recipientEmail: "user3@example.com",
          userId: "user-3",
          eventType: "opened" as const,
          timestamp: new Date(Date.now() - 2800000),
          provider: "test",
          campaignId: "campaign-3",
          templateName: "password-reset",
        },
        {
          emailId: "email-789",
          recipientEmail: "user3@example.com",
          userId: "user-3",
          eventType: "unsubscribed" as const,
          timestamp: new Date(Date.now() - 2700000),
          provider: "test",
          campaignId: "campaign-3",
          templateName: "password-reset",
        },
      ];

      for (const event of events) {
        await analyticsService.trackEvent(event);
      }
    });

    it("should calculate overall metrics", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
      });

      expect(result.overall.sent).toBe(3);
      expect(result.overall.delivered).toBe(2);
      expect(result.overall.opened).toBe(2);
      expect(result.overall.clicked).toBe(1);
      expect(result.overall.bounced).toBe(1);
      expect(result.overall.unsubscribed).toBe(1);
      
      // Check rates
      expect(result.overall.deliveryRate).toBeCloseTo(2/3);
      expect(result.overall.openRate).toBeCloseTo(2/2);
      expect(result.overall.clickRate).toBeCloseTo(1/2);
      expect(result.overall.bounceRate).toBeCloseTo(1/3);
      expect(result.overall.unsubscribeRate).toBeCloseTo(1/2);
      expect(result.overall.clickToOpenRate).toBeCloseTo(1/2);
    });

    it("should group metrics by campaign", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        groupBy: "campaign",
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.length).toBe(3);
      
      const campaign1 = result.breakdown?.find(b => b.key === "campaign-1");
      expect(campaign1).toBeDefined();
      expect(campaign1?.metrics.sent).toBe(1);
      expect(campaign1?.metrics.delivered).toBe(1);
      expect(campaign1?.metrics.opened).toBe(1);
      expect(campaign1?.metrics.clicked).toBe(1);
      
      const campaign2 = result.breakdown?.find(b => b.key === "campaign-2");
      expect(campaign2).toBeDefined();
      expect(campaign2?.metrics.sent).toBe(1);
      expect(campaign2?.metrics.bounced).toBe(1);
      
      const campaign3 = result.breakdown?.find(b => b.key === "campaign-3");
      expect(campaign3).toBeDefined();
      expect(campaign3?.metrics.sent).toBe(1);
      expect(campaign3?.metrics.delivered).toBe(1);
      expect(campaign3?.metrics.opened).toBe(1);
      expect(campaign3?.metrics.unsubscribed).toBe(1);
    });

    it("should group metrics by template", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        groupBy: "template",
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.length).toBe(3);
      
      const welcome = result.breakdown?.find(b => b.key === "welcome");
      expect(welcome).toBeDefined();
      expect(welcome?.metrics.sent).toBe(1);
      expect(welcome?.metrics.clicked).toBe(1);
      
      const orderConfirmation = result.breakdown?.find(b => b.key === "order-confirmation");
      expect(orderConfirmation).toBeDefined();
      expect(orderConfirmation?.metrics.sent).toBe(1);
      expect(orderConfirmation?.metrics.bounced).toBe(1);
      
      const passwordReset = result.breakdown?.find(b => b.key === "password-reset");
      expect(passwordReset).toBeDefined();
      expect(passwordReset?.metrics.sent).toBe(1);
      expect(passwordReset?.metrics.unsubscribed).toBe(1);
    });

    it("should filter metrics by user ID", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        userId: "user-1",
      });

      expect(result.overall.sent).toBe(1);
      expect(result.overall.delivered).toBe(1);
      expect(result.overall.opened).toBe(1);
      expect(result.overall.clicked).toBe(1);
    });

    it("should filter metrics by recipient email", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        recipientEmail: "user2@example.com",
      });

      expect(result.overall.sent).toBe(1);
      expect(result.overall.bounced).toBe(1);
    });

    it("should filter metrics by campaign ID", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        campaignId: "campaign-3",
      });

      expect(result.overall.sent).toBe(1);
      expect(result.overall.delivered).toBe(1);
      expect(result.overall.opened).toBe(1);
      expect(result.overall.unsubscribed).toBe(1);
    });

    it("should filter metrics by template name", async () => {
      const result = await analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000),
        templateName: "password-reset",
      });

      expect(result.overall.sent).toBe(1);
      expect(result.overall.delivered).toBe(1);
      expect(result.overall.opened).toBe(1);
      expect(result.overall.unsubscribed).toBe(1);
    });
  });

  describe("getHealth", () => {
    it("should return healthy status", async () => {
      const health = await analyticsService.getHealth();
      
      expect(health.status).toBe("healthy");
      expect(health.details).toBeDefined();
      expect(health.details.eventCount).toBe(0);
    });
  });
});
