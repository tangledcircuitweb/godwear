import { z } from "zod";
import { createApiResponse } from "../../../lib/api-utils";

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Base email request schema
 */
export const BaseEmailRequestSchema = z.object({
  to: z.union([
    z.string().email({}),
    z.array(z.string().email({})),
    z.object({
      email: z.string().email({}),
      name: z.string().optional(),
    }),
    z.array(
      z.object({
        email: z.string().email({}),
        name: z.string().optional(),
      })
    ),
  ], {}),
  cc: z.union([
    z.string().email({}),
    z.array(z.string().email({})),
    z.object({
      email: z.string().email({}),
      name: z.string().optional(),
    }),
    z.array(
      z.object({
        email: z.string().email({}),
        name: z.string().optional(),
      })
    ),
  ], {}).optional(),
  bcc: z.union([
    z.string().email({}),
    z.array(z.string().email({})),
    z.object({
      email: z.string().email({}),
      name: z.string().optional(),
    }),
    z.array(
      z.object({
        email: z.string().email({}),
        name: z.string().optional(),
      })
    ),
  ], {}).optional(),
  subject: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"], {}).optional(),
  scheduledFor: z.union([z.string(), z.date()], {}).optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Raw email request schema
 */
export const RawEmailRequestSchema = BaseEmailRequestSchema.extend({
  type: z.literal("raw"),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(
    z.object({
      filename: z.string(),
      content: z.string(),
      contentType: z.string().optional(),
    })
  ).optional(),
});

/**
 * Templated email request schema
 */
export const TemplatedEmailRequestSchema = BaseEmailRequestSchema.extend({
  type: z.literal("templated"),
  templateName: z.string(),
  templateData: z.record(z.string(), z.unknown()),
});

/**
 * Combined email request schema
 */
export const EmailRequestSchema = z.discriminatedUnion("type", [
  RawEmailRequestSchema,
  TemplatedEmailRequestSchema,
], {});

/**
 * Email resend request schema
 */
export const EmailResendRequestSchema = z.object({
  emailId: z.string(),
  updateRecipient: z.boolean().optional(),
  newRecipient: z.object({
    email: z.string().email({}),
    name: z.string().optional(),
  }).optional(),
});

/**
 * Email status request schema
 */
export const EmailStatusRequestSchema = z.object({
  emailId: z.string(),
});

/**
 * Email cancel request schema
 */
export const EmailCancelRequestSchema = z.object({
  emailId: z.string(),
});

/**
 * Email batch request schema
 */
export const EmailBatchRequestSchema = z.object({
  emails: z.array(EmailRequestSchema),
  batchId: z.string().optional(),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Email response schema
 */
export const EmailResponseSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  messageId: z.string().optional(),
  timestamp: z.string(),
  provider: z.string(),
  recipient: z.string(),
  subject: z.string(),
  status: z.enum([
    "queued", 
    "scheduled", 
    "sending", 
    "sent", 
    "delivered", 
    "failed", 
    "bounced", 
    "rejected", 
    "cancelled"
  ], {}),
  error: z.string().optional(),
  scheduledFor: z.string().optional(),
  sentAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  failedAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Email status response schema
 */
export const EmailStatusResponseSchema = z.object({
  id: z.string(),
  status: z.enum([
    "queued", 
    "scheduled", 
    "sending", 
    "sent", 
    "delivered", 
    "failed", 
    "bounced", 
    "rejected", 
    "cancelled"
  ], {}),
  events: z.array(
    z.object({
      type: z.string(),
      timestamp: z.string(),
      data: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  recipient: z.string(),
  subject: z.string(),
  scheduledFor: z.string().optional(),
  sentAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  openedAt: z.string().optional(),
  clickedAt: z.string().optional(),
  failedAt: z.string().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Email batch response schema
 */
export const EmailBatchResponseSchema = z.object({
  batchId: z.string(),
  totalEmails: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  results: z.array(EmailResponseSchema),
});

// ============================================================================
// API RESPONSE CREATORS
// ============================================================================

/**
 * Create an API response for a single email
 */
export const createEmailResponse = createApiResponse(EmailResponseSchema);

/**
 * Create an API response for email status
 */
export const createEmailStatusResponse = createApiResponse(EmailStatusResponseSchema);

/**
 * Create an API response for email batch
 */
export const createEmailBatchResponse = createApiResponse(EmailBatchResponseSchema);
