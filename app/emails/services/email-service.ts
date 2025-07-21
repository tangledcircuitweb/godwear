import { z } from "zod";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../../services/base";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Email recipient schema
 */
const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

/**
 * Email attachment schema
 */
const EmailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  contentType: z.string().optional(),
  disposition: z.enum(["attachment", "inline"]).optional(),
  id: z.string().optional(), // For inline attachments (CID)
});

/**
 * Base email options schema
 */
const BaseEmailOptionsSchema = z.object({
  recipient: EmailRecipientSchema,
  cc: z.array(EmailRecipientSchema).optional(),
  bcc: z.array(EmailRecipientSchema).optional(),
  subject: z.string(),
  attachments: z.array(EmailAttachmentSchema).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  replyTo: EmailRecipientSchema.optional(),
});

/**
 * Raw email options schema
 */
const RawEmailOptionsSchema = BaseEmailOptionsSchema.extend({
  html: z.string(),
  text: z.string(),
});

/**
 * Templated email options schema
 */
const TemplatedEmailOptionsSchema = BaseEmailOptionsSchema.extend({
  templateName: z.string(),
  data: z.record(z.string(), z.unknown()),
});

/**
 * Email result schema
 */
const EmailResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  provider: z.string(),
  recipient: z.string(),
  templateName: z.string().optional(),
  subject: z.string(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;
export type BaseEmailOptions = z.infer<typeof BaseEmailOptionsSchema>;
export type RawEmailOptions = z.infer<typeof RawEmailOptionsSchema>;
export type TemplatedEmailOptions = z.infer<typeof TemplatedEmailOptionsSchema>;
export type EmailResult = z.infer<typeof EmailResultSchema>;

/**
 * Email service interface for sending transactional emails
 */
export interface EmailService extends BaseService {
  /**
   * Send a raw email with HTML and plain text content
   */
  sendRawEmail(options: RawEmailOptions): Promise<EmailResult>;

  /**
   * Send an email using a template
   */
  sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult>;

  /**
   * Get health status of the email service
   */
  getHealth(): Promise<ServiceHealthStatus>;
}

/**
 * Abstract base class for email service implementations
 */
export abstract class BaseEmailService implements EmailService {
  readonly serviceName = "email-service";
  protected env: Record<string, any> = {};
  protected logger?: ServiceDependencies["logger"];

  // Static schema exports
  static readonly EmailRecipientSchema = EmailRecipientSchema;
  static readonly EmailAttachmentSchema = EmailAttachmentSchema;
  static readonly BaseEmailOptionsSchema = BaseEmailOptionsSchema;
  static readonly RawEmailOptionsSchema = RawEmailOptionsSchema;
  static readonly TemplatedEmailOptionsSchema = TemplatedEmailOptionsSchema;
  static readonly EmailResultSchema = EmailResultSchema;

  /**
   * Initialize the email service with dependencies
   */
  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
  }

  /**
   * Send a raw email with HTML and plain text content
   */
  abstract sendRawEmail(options: RawEmailOptions): Promise<EmailResult>;

  /**
   * Send an email using a template
   */
  abstract sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult>;

  /**
   * Get health status of the email service
   */
  abstract getHealth(): Promise<ServiceHealthStatus>;

  /**
   * Validate email options using Zod schemas
   */
  protected validateRawEmailOptions(options: RawEmailOptions): RawEmailOptions {
    return RawEmailOptionsSchema.parse(options);
  }

  /**
   * Validate templated email options using Zod schemas
   */
  protected validateTemplatedEmailOptions(options: TemplatedEmailOptions): TemplatedEmailOptions {
    return TemplatedEmailOptionsSchema.parse(options);
  }

  /**
   * Create a successful email result
   */
  protected createSuccessResult(
    messageId: string,
    options: RawEmailOptions | TemplatedEmailOptions,
    provider: string
  ): EmailResult {
    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
      provider,
      recipient: options.recipient.email,
      templateName: "templateName" in options ? options.templateName : undefined,
      subject: options.subject,
    };
  }

  /**
   * Create an error email result
   */
  protected createErrorResult(
    error: string,
    options: RawEmailOptions | TemplatedEmailOptions,
    provider: string
  ): EmailResult {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      provider,
      recipient: options.recipient.email,
      templateName: "templateName" in options ? options.templateName : undefined,
      subject: options.subject,
    };
  }
}
