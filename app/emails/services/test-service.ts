import { BaseEmailService, EmailResult, RawEmailOptions, TemplatedEmailOptions } from "./email-service";
import type { ServiceHealthStatus } from "../../services/base";
import { renderTemplate } from "../utils/template-engine";

/**
 * Test email service for development
 * Logs emails instead of sending them
 */
export class TestEmailService extends BaseEmailService {
  readonly serviceName = "test-email-service";
  private templateDir: string;

  /**
   * Initialize the test email service
   */
  override initialize(dependencies: Parameters<BaseEmailService["initialize"]>[0]): void {
    super.initialize(dependencies);
    this.templateDir = this.env.TEST_EMAIL_TEMPLATE_DIR || "/app/emails/templates";
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
      `Type: ${emailData.type}`,
      `To: ${emailData.recipient.email} ${emailData.recipient.name ? `(${emailData.recipient.name})` : ""}`,
      emailData.cc?.length ? `CC: ${emailData.cc.map((r: any) => r.email).join(", ")}` : null,
      emailData.bcc?.length ? `BCC: ${emailData.bcc.map((r: any) => r.email).join(", ")}` : null,
      `Subject: ${emailData.subject}`,
      emailData.templateName ? `Template: ${emailData.templateName}` : null,
      emailData.attachments?.length ? `Attachments: ${emailData.attachments.join(", ")}` : null,
      "-".repeat(80),
      emailData.type === "templated" ? "Template Data:" : null,
      emailData.type === "templated" ? JSON.stringify(emailData.data, null, 2) : null,
      emailData.type === "templated" ? "-".repeat(80) : null,
      "Text Content:",
      emailData.text,
      "-".repeat(80),
      "HTML Content:",
      emailData.html,
      "=".repeat(80),
    ]
      .filter(Boolean)
      .join("\n");

    // Log to console
    console.log(logMessage);

    // Log to service logger if available
    this.logger?.info("Test email sent", {
      recipient: emailData.recipient.email,
      subject: emailData.subject,
      templateName: emailData.templateName,
    });
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
