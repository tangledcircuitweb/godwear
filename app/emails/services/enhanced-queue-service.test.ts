import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnhancedEmailQueueService } from "./enhanced-queue-service";
import type { ServiceDependencies } from "../../services/base";

describe("EnhancedEmailQueueService", () => {
  let queueService: EnhancedEmailQueueService;
  let mockDependencies: ServiceDependencies;

  beforeEach(() => {
    // Mock dependencies
    mockDependencies = {
      env: {
        EMAIL_QUEUE_MAX_CONCURRENT: "3",
        EMAIL_QUEUE_RATE_HIGH: "5",
        EMAIL_QUEUE_BATCH_SIZE: "2",
      },
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as ServiceDependencies;

    // Create service
    queueService = new EnhancedEmailQueueService();
    queueService.initialize(mockDependencies);

    // Mock internal email service
    const mockSendRawEmail = vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "test@example.com",
      subject: "Test Email",
    });

    const mockSendTemplatedEmail = vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "test@example.com",
      subject: "Test Email",
      templateName: "test-template",
    });

    // @ts-ignore - Mock private property
    queueService.emailService = {
      sendRawEmail: mockSendRawEmail,
      sendTemplatedEmail: mockSendTemplatedEmail,
    };
  });

  describe("sendRawEmail", () => {
    it("should enqueue a raw email", async () => {
      const result = await queueService.sendRawEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
      expect(result.status).toBe("queued");
    });

    it("should handle priority options", async () => {
      const result = await queueService.sendRawEmail(
        {
          to: "test@example.com",
          subject: "Critical Email",
          html: "<p>Critical content</p>",
        },
        { priority: "critical" }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
    });

    it("should handle scheduling", async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
      
      const result = await queueService.sendRawEmail(
        {
          to: "test@example.com",
          subject: "Scheduled Email",
          html: "<p>Scheduled content</p>",
        },
        { scheduledFor: scheduledTime }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
    });

    it("should handle idempotency keys", async () => {
      // First email with idempotency key
      const result1 = await queueService.sendRawEmail({
        to: "test@example.com",
        subject: "Idempotent Email",
        html: "<p>Idempotent content</p>",
        idempotencyKey: "test-idempotency-key",
      });

      expect(result1.success).toBe(true);

      // Second email with same idempotency key
      const result2 = await queueService.sendRawEmail({
        to: "test@example.com",
        subject: "Idempotent Email",
        html: "<p>Idempotent content</p>",
        idempotencyKey: "test-idempotency-key",
      });

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("Duplicate email");
    });
  });

  describe("sendTemplatedEmail", () => {
    it("should enqueue a templated email", async () => {
      const result = await queueService.sendTemplatedEmail({
        to: "test@example.com",
        subject: "Test Templated Email",
        templateName: "test-template",
        data: { name: "Test User" },
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
      expect(result.templateName).toBe("test-template");
    });
  });

  describe("scheduleEmail", () => {
    it("should schedule a raw email", async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
      
      const result = await queueService.scheduleEmail(
        {
          to: "test@example.com",
          subject: "Scheduled Raw Email",
          html: "<p>Scheduled raw content</p>",
        },
        scheduledTime
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
    });

    it("should schedule a templated email", async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
      
      const result = await queueService.scheduleEmail(
        {
          to: "test@example.com",
          subject: "Scheduled Templated Email",
          templateName: "test-template",
          data: { name: "Test User" },
        },
        scheduledTime
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("queue");
    });
  });

  describe("getQueueStats", () => {
    it("should return queue statistics", async () => {
      // Add some emails to the queue
      await queueService.sendRawEmail({
        to: "test1@example.com",
        subject: "Test Email 1",
        html: "<p>Test content 1</p>",
      });

      await queueService.sendRawEmail({
        to: "test2@example.com",
        subject: "Test Email 2",
        html: "<p>Test content 2</p>",
      }, { priority: "high" });

      const stats = queueService.getQueueStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
    });
  });

  describe("getHealth", () => {
    it("should return health status", async () => {
      // Mock the underlying email service's getHealth method
      // @ts-ignore - Mock private property
      queueService.emailService.getHealth = vi.fn().mockResolvedValue({
        status: "healthy",
        message: "Email service is operational",
        details: {},
      });

      const health = await queueService.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.details).toBeDefined();
      expect(health.details.queue).toBeDefined();
      expect(health.details.stats).toBeDefined();
    });
  });
});
