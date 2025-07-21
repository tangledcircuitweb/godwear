import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import { createEmailHandlers } from "../../routes/api/emails/handlers";
import { createEmailTestEnvironment } from "./test-utils";
import type { CloudflareBindings } from "../../lib/zod-utils";
import type { Services } from "../../services/registry";

describe("Email API Integration Tests", () => {
  let app: Hono<{ Bindings: CloudflareBindings }>;
  let testEnv = createEmailTestEnvironment();
  let mockServices: Services;
  
  beforeEach(() => {
    // Reset test environment
    testEnv = createEmailTestEnvironment();
    
    // Create mock services
    mockServices = {
      email: testEnv.emailService,
      emailAnalytics: testEnv.analyticsService,
    } as unknown as Services;
    
    // Create app with email handlers
    app = new Hono<{ Bindings: CloudflareBindings }>();
    app.route("/", createEmailHandlers(mockServices));
  });
  
  describe("POST /send", () => {
    it("should send a raw email", async () => {
      const req = new Request("http://localhost/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "raw",
          to: "test@example.com",
          subject: "Test Raw Email",
          html: "<p>Test content</p>",
          text: "Test content",
        }),
      });
      
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(true);
      expect(data.data.recipient).toBe("test@example.com");
      expect(data.data.subject).toBe("Test Raw Email");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      expect(testEnv.capturedEmails[0].subject).toBe("Test Raw Email");
    });
    
    it("should send a templated email", async () => {
      const req = new Request("http://localhost/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "templated",
          to: "test@example.com",
          subject: "Test Templated Email",
          templateName: "test-template",
          templateData: {
            name: "Test User",
          },
        }),
      });
      
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(true);
      expect(data.data.recipient).toBe("test@example.com");
      expect(data.data.subject).toBe("Test Templated Email");
      expect(data.data.templateName).toBe("test-template");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      expect(testEnv.capturedEmails[0].subject).toBe("Test Templated Email");
      expect(testEnv.capturedEmails[0].templateName).toBe("test-template");
    });
    
    it("should handle validation errors", async () => {
      const req = new Request("http://localhost/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "raw",
          // Missing required 'to' field
          subject: "Test Raw Email",
          html: "<p>Test content</p>",
        }),
      });
      
      const res = await app.fetch(req);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
  
  describe("POST /batch", () => {
    it("should send multiple emails", async () => {
      const req = new Request("http://localhost/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: [
            {
              type: "raw",
              to: "test1@example.com",
              subject: "Test Raw Email 1",
              html: "<p>Test content 1</p>",
              text: "Test content 1",
            },
            {
              type: "templated",
              to: "test2@example.com",
              subject: "Test Templated Email 2",
              templateName: "test-template",
              templateData: {
                name: "Test User 2",
              },
            },
          ],
        }),
      });
      
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.totalEmails).toBe(2);
      expect(data.data.successCount).toBe(2);
      expect(data.data.failureCount).toBe(0);
      expect(data.data.results.length).toBe(2);
      
      // Check that the emails were captured
      expect(testEnv.capturedEmails.length).toBe(2);
      expect(testEnv.capturedEmails[0].subject).toBe("Test Raw Email 1");
      expect(testEnv.capturedEmails[1].subject).toBe("Test Templated Email 2");
    });
  });
  
  describe("POST /resend", () => {
    it("should resend an email", async () => {
      // First, send an email to get an ID
      const sendReq = new Request("http://localhost/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "raw",
          to: "test@example.com",
          subject: "Original Email",
          html: "<p>Original content</p>",
          text: "Original content",
        }),
      });
      
      const sendRes = await app.fetch(sendReq);
      const sendData = await sendRes.json();
      const emailId = sendData.data.messageId;
      
      // Mock the resendEmail method
      const resendMock = vi.fn().mockResolvedValue({
        success: true,
        messageId: "resent-" + emailId,
        timestamp: new Date().toISOString(),
        provider: "test",
        recipient: "new@example.com",
        subject: "Resent Email",
      });
      
      testEnv.emailService.resendEmail = resendMock;
      
      // Now resend the email
      const resendReq = new Request("http://localhost/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId,
          updateRecipient: true,
          newRecipient: {
            email: "new@example.com",
          },
        }),
      });
      
      const resendRes = await app.fetch(resendReq);
      expect(resendRes.status).toBe(200);
      
      const resendData = await resendRes.json();
      expect(resendData.success).toBe(true);
      expect(resendData.data.success).toBe(true);
      
      // Check that resendEmail was called with the right parameters
      expect(resendMock).toHaveBeenCalledWith(emailId, {
        updateRecipient: true,
        newRecipient: {
          email: "new@example.com",
        },
      });
    });
  });
  
  describe("GET /:emailId/status", () => {
    it("should get email status", async () => {
      // First, send an email to get an ID
      const sendReq = new Request("http://localhost/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "raw",
          to: "test@example.com",
          subject: "Status Test Email",
          html: "<p>Status test content</p>",
          text: "Status test content",
        }),
      });
      
      const sendRes = await app.fetch(sendReq);
      const sendData = await sendRes.json();
      const emailId = sendData.data.messageId;
      
      // Mock the getEmailStatus method
      const statusMock = vi.fn().mockResolvedValue({
        id: emailId,
        status: "delivered",
        recipient: "test@example.com",
        subject: "Status Test Email",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
      
      testEnv.emailService.getEmailStatus = statusMock;
      
      // Now get the status
      const statusReq = new Request(`http://localhost/${emailId}/status`, {
        method: "GET",
      });
      
      const statusRes = await app.fetch(statusReq);
      expect(statusRes.status).toBe(200);
      
      const statusData = await statusRes.json();
      expect(statusData.success).toBe(true);
      expect(statusData.data.id).toBe(emailId);
      expect(statusData.data.status).toBe("delivered");
      
      // Check that getEmailStatus was called with the right parameters
      expect(statusMock).toHaveBeenCalledWith(emailId);
    });
  });
  
  describe("POST /cancel", () => {
    it("should cancel a scheduled email", async () => {
      // Mock the cancelEmail method
      const cancelMock = vi.fn().mockResolvedValue({
        success: true,
        messageId: "email-123",
        timestamp: new Date().toISOString(),
        provider: "test",
        recipient: "test@example.com",
        subject: "Cancelled Email",
        status: "cancelled",
      });
      
      testEnv.emailService.cancelEmail = cancelMock;
      
      // Cancel the email
      const cancelReq = new Request("http://localhost/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId: "email-123",
        }),
      });
      
      const cancelRes = await app.fetch(cancelReq);
      expect(cancelRes.status).toBe(200);
      
      const cancelData = await cancelRes.json();
      expect(cancelData.success).toBe(true);
      expect(cancelData.data.status).toBe("cancelled");
      
      // Check that cancelEmail was called with the right parameters
      expect(cancelMock).toHaveBeenCalledWith("email-123");
    });
  });
});
