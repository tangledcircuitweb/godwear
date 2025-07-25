import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createApiErrorResponse, createApiResponse } from "../../../lib/api-utils";
import type { CloudflareBindings } from "../../../lib/zod-utils";
import type { Services } from "../../../services/registry";
import { 
  EmailRequestSchema, 
  EmailResendRequestSchema, 
  EmailStatusRequestSchema, 
  EmailCancelRequestSchema,
  EmailBatchRequestSchema
} from "./schemas";

/**
 * Create email management API handlers
 */
export function createEmailHandlers(services: Services) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * Send an email
   * POST /api/emails/send
   */
  app.post(
    "/send",
    zValidator("json", EmailRequestSchema),
    async (c) => {
      try {
        const emailRequest = c.req.valid("json");
        const { email } = services;
        
        let result;
        
        if (emailRequest.type === "raw") {
          // Handle raw email
          result = await email.sendRawEmail({
            recipient: emailRequest.to,
            cc: emailRequest.cc,
            bcc: emailRequest.bcc,
            subject: emailRequest.subject,
            html: emailRequest.html,
            text: emailRequest.text,
            attachments: emailRequest.attachments,
            metadata: emailRequest.metadata,
          });
        } else {
          // Handle templated email
          result = await email.sendTemplatedEmail({
            recipient: emailRequest.to,
            cc: emailRequest.cc,
            bcc: emailRequest.bcc,
            subject: emailRequest.subject,
            templateName: emailRequest.templateName,
            data: emailRequest.templateData,
            metadata: emailRequest.metadata,
          });
        }
        
        return c.json(createApiResponse(result));
      } catch (error) {
        console.error("Failed to send email", error);
        return c.json(
          createApiErrorResponse(
            error instanceof Error ? error.message : "Failed to send email"
          ),
          error instanceof z.ZodError ? 400 : 500
        );
      }
    }
  );

  /**
   * Send a batch of emails
   * POST /api/emails/batch
   */
  app.post(
    "/batch",
    zValidator("json", EmailBatchRequestSchema),
    async (c) => {
      try {
        const { emails, batchId } = c.req.valid("json");
        const { email } = services;
        
        // Generate a batch ID if not provided
        const actualBatchId = batchId || crypto.randomUUID();
        
        // Process each email in the batch
        const results = await Promise.all(
          emails.map(async (emailRequest) => {
            try {
              if (emailRequest.type === "raw") {
                // Handle raw email
                return await email.sendRawEmail({
                  recipient: emailRequest.to,
                  cc: emailRequest.cc,
                  bcc: emailRequest.bcc,
                  subject: emailRequest.subject,
                  html: emailRequest.html,
                  text: emailRequest.text,
                  attachments: emailRequest.attachments,
                  metadata: {
                    ...emailRequest.metadata,
                    batchId: actualBatchId,
                  },
                });
              } else {
                // Handle templated email
                return await email.sendTemplatedEmail({
                  recipient: emailRequest.to,
                  cc: emailRequest.cc,
                  bcc: emailRequest.bcc,
                  subject: emailRequest.subject,
                  templateName: emailRequest.templateName,
                  data: emailRequest.templateData,
                  metadata: {
                    ...emailRequest.metadata,
                    batchId: actualBatchId,
                  },
                });
              }
            } catch (error) {
              // Return error result for this email
              return {
                id: crypto.randomUUID(),
                success: false,
                timestamp: new Date().toISOString(),
                provider: "batch-api",
                recipient: Array.isArray(emailRequest.to) 
                  ? (typeof emailRequest.to[0] === "string" ? emailRequest.to[0] : emailRequest.to[0].email)
                  : (typeof emailRequest.to === "string" ? emailRequest.to : emailRequest.to.email),
                subject: emailRequest.subject,
                status: "failed",
                error: error instanceof Error ? error.message : "Failed to send email",
              };
            }
          })
        );
        
        // Calculate success and failure counts
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        return c.json(
          createApiResponse({
            batchId: actualBatchId,
            totalEmails: results.length,
            successCount,
            failureCount,
            results,
          })
        );
      } catch (error) {
        console.error("Failed to process email batch", error);
        return c.json(
          createApiErrorResponse(
            error instanceof Error ? error.message : "Failed to process email batch"
          ),
          error instanceof z.ZodError ? 400 : 500
        );
      }
    }
  );

  /**
   * Resend an email
   * POST /api/emails/resend
   */
  app.post(
    "/resend",
    zValidator("json", EmailResendRequestSchema),
    async (c) => {
      try {
        const { emailId, updateRecipient, newRecipient } = c.req.valid("json");
        const { email } = services;
        
        // Resend the email
        const result = await email.resendEmail(emailId, {
          updateRecipient,
          newRecipient,
        });
        
        return c.json(createApiResponse(result));
      } catch (error) {
        console.error("Failed to resend email", error);
        return c.json(
          createApiErrorResponse(
            error instanceof Error ? error.message : "Failed to resend email"
          ),
          error instanceof z.ZodError ? 400 : 500
        );
      }
    }
  );

  /**
   * Get email status
   * GET /api/emails/:emailId/status
   */
  app.get(
    "/:emailId/status",
    async (c) => {
      try {
        const emailId = c.req.param("emailId");
        const { email, emailAnalytics } = services;
        
        // Get email status from the email service
        const emailStatus = await email.getEmailStatus(emailId);
        
        // Get email events from the analytics service
        const eventsResult = await emailAnalytics.queryEvents({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          emailId,
        });
        
        // Map events to the expected format
        const events = eventsResult.events.map(event => ({
          type: event.eventType,
          timestamp: new Date(event.timestamp).toISOString(),
          data: event.metadata,
        }));
        
        // Find timestamps for specific events
        const findEventTimestamp = (eventType: string) => {
          const event = eventsResult.events.find(e => e.eventType === eventType);
          return event ? new Date(event.timestamp).toISOString() : undefined;
        };
        
        const sentAt = findEventTimestamp("sent");
        const deliveredAt = findEventTimestamp("delivered");
        const openedAt = findEventTimestamp("opened");
        const clickedAt = findEventTimestamp("clicked");
        const failedAt = findEventTimestamp("bounced") || findEventTimestamp("failed");
        
        // Get failure reason if available
        const failureEvent = eventsResult.events.find(e => e.eventType === "bounced" || e.eventType === "failed");
        const failureReason = failureEvent?.metadata?.reason || failureEvent?.metadata?.error;
        
        return c.json(
          createApiResponse({
            id: emailId,
            status: emailStatus.status,
            events,
            recipient: emailStatus.recipient,
            subject: emailStatus.subject,
            scheduledFor: emailStatus.scheduledFor,
            sentAt,
            deliveredAt,
            openedAt,
            clickedAt,
            failedAt,
            failureReason,
            metadata: emailStatus.metadata,
          })
        );
      } catch (error) {
        console.error("Failed to get email status", error);
        return c.json(
          createApiErrorResponse(
            error instanceof Error ? error.message : "Failed to get email status"
          ),
          error instanceof z.ZodError ? 400 : 500
        );
      }
    }
  );

  /**
   * Cancel a scheduled email
   * POST /api/emails/cancel
   */
  app.post(
    "/cancel",
    zValidator("json", EmailCancelRequestSchema),
    async (c) => {
      try {
        const { emailId } = c.req.valid("json");
        const { email } = services;
        
        // Cancel the email
        const result = await email.cancelEmail(emailId);
        
        return c.json(createApiResponse(result));
      } catch (error) {
        console.error("Failed to cancel email", error);
        return c.json(
          createApiErrorResponse(
            error instanceof Error ? error.message : "Failed to cancel email"
          ),
          error instanceof z.ZodError ? 400 : 500
        );
      }
    }
  );

  return app;
}
