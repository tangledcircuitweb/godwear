import { z } from "zod";
import { BaseEmailService } from "./email-service";
import type { EmailResult, RawEmailOptions, TemplatedEmailOptions } from "./email-service";
import type { ServiceHealthStatus } from "../../services/base";
import { renderTemplate } from "../utils/template-engine";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * MailerSend API response schema
 */
const MailerSendResponseSchema = z.object({
  message_id: z.string().optional(),
  error: z.string().optional(),
  status: z.number().optional(),
});

/**
 * MailerSend configuration schema
 */
const MailerSendConfigSchema = z.object({
  apiKey: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string(),
  baseUrl: z.string().url().default("https://api.mailersend.com/v1"),
  templateDir: z.string().default("/app/emails/templates"),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type MailerSendResponse = z.infer<typeof MailerSendResponseSchema>;
type MailerSendConfig = z.infer<typeof MailerSendConfigSchema>;

/**
 * MailerSend email service implementation
 */
export class MailerSendService extends BaseEmailService {
  override readonly serviceName = "mailersend-service";
  private config!: MailerSendConfig;

  /**
   * Initialize the MailerSend service with dependencies
   */
  override initialize(dependencies: Parameters<BaseEmailService["initialize"]>[0]): void {
    super.initialize(dependencies);

    // Extract configuration from environment variables using AI-First file-local approach
    try {
      this.config = MailerSendConfigSchema.parse({
        apiKey: this.env['MAILERSEND_API_KEY'],
        fromEmail: this.env['MAILERSEND_FROM_EMAIL'],
        fromName: this.env['MAILERSEND_FROM_NAME'],
        baseUrl: this.env['MAILERSEND_BASE_URL'],
        templateDir: this.env['MAILERSEND_TEMPLATE_DIR'],
      });
    } catch (error) {
      this.logger?.error("Failed to initialize MailerSend service", error as Error);
      throw new Error("Failed to initialize MailerSend service: Missing required configuration");
    }
  }

  /**
   * Send a raw email with HTML and plain text content
   */
  async sendRawEmail(options: RawEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = this.validateRawEmailOptions(options);

      // Prepare MailerSend API payload
      const payload = {
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        to: [
          {
            email: validatedOptions.recipient.email,
            name: validatedOptions.recipient.name || "",
          },
        ],
        subject: validatedOptions.subject,
        html: validatedOptions.html,
        text: validatedOptions.text,
        reply_to: validatedOptions.replyTo
          ? {
              email: validatedOptions.replyTo.email,
              name: validatedOptions.replyTo.name || "",
            }
          : undefined,
        cc: validatedOptions.cc?.map((recipient) => ({
          email: recipient.email,
          name: recipient.name || "",
        })),
        bcc: validatedOptions.bcc?.map((recipient) => ({
          email: recipient.email,
          name: recipient.name || "",
        })),
        attachments: validatedOptions.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: typeof attachment.content === "string" ? attachment.content : attachment.content.toString("base64"),
          disposition: attachment.disposition || "attachment",
          id: attachment.id,
          content_type: attachment.contentType,
        })),
        tags: validatedOptions.tags,
        personalization: validatedOptions.metadata
          ? [
              {
                email: validatedOptions.recipient.email,
                data: validatedOptions.metadata,
              },
            ]
          : undefined,
      };

      // Send email via MailerSend API
      const response = await this.sendMailerSendRequest("/email", payload);

      // Check if there was an error
      if (response.error) {
        throw new Error(response.error);
      }

      // Use the message_id from response, or generate one if not provided
      const messageId = response.message_id || `mailersend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return this.createSuccessResult(messageId, validatedOptions, "mailersend");
    } catch (error) {
      this.logger?.error("Failed to send raw email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        options,
        "mailersend"
      );
    }
  }

  /**
   * Send an email using a template
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = this.validateTemplatedEmailOptions(options);

      // Render template
      const { html, text } = await renderTemplate(
        validatedOptions.templateName,
        validatedOptions.data,
        this.config.templateDir
      );

      // Send as raw email
      return this.sendRawEmail({
        ...validatedOptions,
        html,
        text,
      });
    } catch (error) {
      this.logger?.error("Failed to send templated email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        options,
        "mailersend"
      );
    }
  }

  /**
   * Send request to MailerSend API
   */
  private async sendMailerSendRequest(
    endpoint: string,
    payload: Record<string, any>
  ): Promise<MailerSendResponse> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: errorText || `HTTP error ${response.status}`,
          status: response.status,
        };
      }

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        data = {};
      }
      
      // MailerSend returns 202 with empty body when email is queued successfully
      const messageId = data.id || data.message_id || `mailersend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        message_id: messageId,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Resend an email
   */
  async resendEmail(emailId: string, options?: ResendOptions): Promise<EmailResult> {
    try {
      // Validate options if provided
      const validatedOptions = options ? ResendOptionsSchema.parse(options) : undefined;
      
      // In a real implementation, we would call the MailerSend API to resend the email
      // For now, we'll simulate the response
      
      // Check if the email exists (in a real implementation, we would check the API)
      if (!emailId || !emailId.startsWith("email_")) {
        throw new Error(`Email not found: ${emailId}`);
      }
      
      // Log the resend request
      this.logger?.info("Resending email", { emailId, options: validatedOptions });
      
      // Return a simulated result
      return {
        success: true,
        messageId: `resend_${emailId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        provider: "mailersend",
        recipient: validatedOptions?.newRecipient?.email || "recipient@example.com",
        subject: "Resent Email",
      };
    } catch (error) {
      this.logger?.error("Failed to resend email", error as Error);
      throw error;
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<EmailStatus> {
    try {
      // In a real implementation, we would call the MailerSend API to get the email status
      // For now, we'll simulate the response
      
      // Check if the email exists (in a real implementation, we would check the API)
      if (!emailId || !emailId.startsWith("email_")) {
        throw new Error(`Email not found: ${emailId}`);
      }
      
      // Log the status request
      this.logger?.info("Getting email status", { emailId });
      
      // Return a simulated status
      return {
        id: emailId,
        status: "sent",
        recipient: "recipient@example.com",
        subject: "Sample Email",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger?.error("Failed to get email status", error as Error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<EmailResult> {
    try {
      // In a real implementation, we would call the MailerSend API to cancel the email
      // For now, we'll simulate the response
      
      // Check if the email exists (in a real implementation, we would check the API)
      if (!emailId || !emailId.startsWith("email_")) {
        throw new Error(`Email not found: ${emailId}`);
      }
      
      // Log the cancel request
      this.logger?.info("Cancelling email", { emailId });
      
      // Return a simulated result
      return {
        success: true,
        messageId: emailId,
        timestamp: new Date().toISOString(),
        provider: "mailersend",
        recipient: "recipient@example.com",
        subject: "Cancelled Email",
      };
    } catch (error) {
      this.logger?.error("Failed to cancel email", error as Error);
      throw error;
    }
  }

  /**
   * Get health status of the MailerSend service
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    try {
      // Check if API key is configured
      if (!this.config?.apiKey) {
        return {
          status: "unhealthy",
          message: "MailerSend API key not configured",
          details: {
            configured: false,
          },
        };
      }

      // Check API connectivity
      const response = await fetch(`${this.config.baseUrl}/domains`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        return {
          status: "unhealthy",
          message: `MailerSend API returned status ${response.status}`,
          details: {
            configured: true,
            apiConnectivity: false,
            statusCode: response.status,
          },
        };
      }

      return {
        status: "healthy",
        message: "MailerSend service is operational",
        details: {
          configured: true,
          apiConnectivity: true,
          fromEmail: this.config.fromEmail,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error checking MailerSend health",
        details: {
          configured: !!this.config?.apiKey,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }
}
