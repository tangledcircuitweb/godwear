import { z } from "zod";
import { BaseEmailService } from "./email-service";
import type { EmailResult, RawEmailOptions, TemplatedEmailOptions } from "./email-service";
import type { ServiceHealthStatus } from "../../services/base";
import { renderTemplate } from "../utils/template-engine";

// ============================================================================
// LOCAL SCHEMAS - AI-First file-local approach
// ============================================================================

/**
 * Local environment schema for this service
 */
const LocalEnvironmentSchema = z.object({
  TEST_EMAIL_TEMPLATE_DIR: z.string().optional(),
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

/**
 * Local resend options schema for this service
 */
const LocalResendOptionsSchema = z.object({
  updateRecipient: z.boolean().optional(),
  newRecipient: z.object({
    email: z.string().email({}),
    name: z.string().optional(),
  }).optional(),
});

/**
 * Local email status schema for this service
 */
const LocalEmailStatusSchema = z.object({
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
  recipient: z.string(),
  subject: z.string(),
  scheduledFor: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type LocalResendOptions = z.infer<typeof LocalResendOptionsSchema>;
type LocalEmailStatus = z.infer<typeof LocalEmailStatusSchema>;

/**
 * Test email service for development
 * Logs emails instead of sending them
 */
export class TestEmailService extends BaseEmailService {
  override readonly serviceName = "test-email-service";
  private templateDir!: string;

  constructor() {
    super();
  }

  /**
   * Initialize the test email service
   */
  override initialize(dependencies: Parameters<BaseEmailService["initialize"]>[0]): void {
    super.initialize(dependencies);
    this.templateDir = this.env['TEST_EMAIL_TEMPLATE_DIR'] || "/app/emails/templates";
  }

  /**
   * Send a raw email (logs instead of sending)
   */
  async sendRawEmail(options: RawEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = this.validateRawEmailOptions(options);

      // Generate a fake message ID
      const messageId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Log the email
      this.logEmail({
        type: "raw",
        recipient: validatedOptions.recipient,
        cc: validatedOptions.cc,
        bcc: validatedOptions.bcc,
        subject: validatedOptions.subject,
        html: validatedOptions.html,
        text: validatedOptions.text,
        attachments: validatedOptions.attachments?.map((a) => a.filename) || [],
        metadata: validatedOptions.metadata,
      });

      return this.createSuccessResult(messageId, validatedOptions, "test");
    } catch (error) {
      this.logger?.error("Failed to send test raw email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        options,
        "test"
      );
    }
  }

  /**
   * Send a templated email (logs instead of sending)
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = this.validateTemplatedEmailOptions(options);

      // Render template
      const { html, text } = await renderTemplate(
        validatedOptions.templateName,
        validatedOptions.data,
        this.templateDir
      );

      // Generate a fake message ID
      const messageId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Log the email
      this.logEmail({
        type: "templated",
        templateName: validatedOptions.templateName,
        recipient: validatedOptions.recipient,
        cc: validatedOptions.cc,
        bcc: validatedOptions.bcc,
        subject: validatedOptions.subject,
        data: validatedOptions.data,
        html,
        text,
        attachments: validatedOptions.attachments?.map((a) => a.filename) || [],
        metadata: validatedOptions.metadata,
      });

      return this.createSuccessResult(messageId, validatedOptions, "test");
    } catch (error) {
      this.logger?.error("Failed to send test templated email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        options,
        "test"
      );
    }
  }

  /**
   * Log email details instead of sending
   */
  private logEmail(emailData: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    
    // Create a formatted log message
    const logMessage = [
      "=".repeat(80),
      `TEST EMAIL (${timestamp})`,
      "=".repeat(80),
      `Type: ${emailData['type']}`,
      `To: ${emailData['recipient'].email} ${emailData['recipient'].name ? `(${emailData['recipient'].name})` : ""}`,
      emailData['cc']?.length ? `CC: ${emailData['cc'].map((r: any) => r.email).join(", ")}` : null,
      emailData['bcc']?.length ? `BCC: ${emailData['bcc'].map((r: any) => r.email).join(", ")}` : null,
      `Subject: ${emailData['subject']}`,
      emailData['templateName'] ? `Template: ${emailData['templateName']}` : null,
      emailData['attachments']?.length ? `Attachments: ${emailData['attachments'].join(", ")}` : null,
      "-".repeat(80),
      emailData['type'] === "templated" ? "Template Data:" : null,
      emailData['type'] === "templated" ? JSON.stringify(emailData['data'], null, 2) : null,
      emailData['type'] === "templated" ? "-".repeat(80) : null,
      "Text Content:",
      emailData['text'],
      "-".repeat(80),
      "HTML Content:",
      emailData['html'],
      "=".repeat(80),
    ]
      .filter(Boolean)
      .join("\n");

    // Log to console
    console.log(logMessage);

    // Log to service logger if available
    this.logger?.info("Test email sent", {
      recipient: emailData['recipient'].email,
      subject: emailData['subject'],
      templateName: emailData['templateName'],
    });
  }

  /**
   * Resend an email
   */
  async resendEmail(emailId: string, options?: LocalResendOptions): Promise<EmailResult> {
    try {
      // Validate options if provided
      const validatedOptions = options ? LocalResendOptionsSchema.parse(options) : undefined;
      
      // Log the resend request
      this.logger?.info("Test service: Resending email", { emailId, options: validatedOptions });
      
      // Return a simulated result
      return {
        success: true,
        messageId: `test_resend_${emailId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        provider: "test",
        recipient: validatedOptions?.newRecipient?.email || "recipient@example.com",
        subject: "Resent Test Email",
      };
    } catch (error) {
      this.logger?.error("Test service: Failed to resend email", error as Error);
      throw error;
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<LocalEmailStatus> {
    try {
      // Log the status request
      this.logger?.info("Test service: Getting email status", { emailId });
      
      // Return a simulated status
      return {
        id: emailId,
        status: "sent",
        recipient: "recipient@example.com",
        subject: "Test Email",
        metadata: {
          timestamp: new Date().toISOString(),
          test: true,
        },
      };
    } catch (error) {
      this.logger?.error("Test service: Failed to get email status", error as Error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<EmailResult> {
    try {
      // Log the cancel request
      this.logger?.info("Test service: Cancelling email", { emailId });
      
      // Return a simulated result
      return {
        success: true,
        messageId: emailId,
        timestamp: new Date().toISOString(),
        provider: "test",
        recipient: "recipient@example.com",
        subject: "Cancelled Test Email",
      };
    } catch (error) {
      this.logger?.error("Test service: Failed to cancel email", error as Error);
      throw error;
    }
  }

  /**
   * Get health status of the test email service
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    return {
      status: "healthy",
      message: "Test email service is operational",
      details: {
        mode: "test",
        templateDir: this.templateDir,
      },
    };
  }
}
