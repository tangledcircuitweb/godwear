import { z } from "zod";
import { TestEmailService } from "../services/test-service";
import { TransactionalEmailService } from "../services/transactional-email-service";
import { EnhancedEmailQueueService } from "../services/enhanced-queue-service";
import { InMemoryEmailAnalyticsService } from "../analytics/in-memory-analytics-service";
import type { EmailResult, RawEmailOptions, TemplatedEmailOptions } from "../services/email-service";
import type { ServiceDependencies } from "../../services/base";

/**
 * Email test environment configuration
 */
export interface EmailTestEnvironment {
  /**
   * Email service to use for testing
   */
  emailService: TestEmailService | TransactionalEmailService | EnhancedEmailQueueService;
  
  /**
   * Email analytics service for tracking events
   */
  analyticsService: InMemoryEmailAnalyticsService;
  
  /**
   * Mock dependencies
   */
  dependencies: ServiceDependencies;
  
  /**
   * Captured emails
   */
  capturedEmails: EmailResult[];
}

/**
 * Create a test environment for email testing
 */
export function createEmailTestEnvironment(): EmailTestEnvironment {
  // Create mock dependencies
  const dependencies: ServiceDependencies = {
    env: {
      BASE_URL: "https://test.godwear.com",
      LOGO_URL: "https://test.godwear.com/logo.png",
      SUPPORT_EMAIL: "support@test.godwear.com",
      EMAIL_QUEUE_MAX_CONCURRENT: "5",
      EMAIL_QUEUE_BATCH_SIZE: "10",
    },
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  } as unknown as ServiceDependencies;
  
  // Create email service
  const emailService = new TestEmailService();
  emailService.initialize(dependencies);
  
  // Create analytics service
  const analyticsService = new InMemoryEmailAnalyticsService();
  analyticsService.initialize(dependencies);
  
  // Create array to capture sent emails
  const capturedEmails: EmailResult[] = [];
  
  // Override sendRawEmail to capture emails
  const originalSendRawEmail = emailService.sendRawEmail.bind(emailService);
  emailService.sendRawEmail = async (options: RawEmailOptions) => {
    const result = await originalSendRawEmail(options);
    capturedEmails.push(result);
    
    // Track email events
    if (result.success) {
      await analyticsService.trackEvent({
        id: crypto.randomUUID(),
        emailId: result.messageId || "unknown",
        recipientEmail: typeof options.to === "string" ? options.to : 
          Array.isArray(options.to) ? 
            (typeof options.to[0] === "string" ? options.to[0] : options.to[0].email) : 
            options.to.email,
        eventType: "sent",
        timestamp: new Date(),
        provider: "test",
      });
    }
    
    return result;
  };
  
  // Override sendTemplatedEmail to capture emails
  const originalSendTemplatedEmail = emailService.sendTemplatedEmail.bind(emailService);
  emailService.sendTemplatedEmail = async (options: TemplatedEmailOptions) => {
    const result = await originalSendTemplatedEmail(options);
    capturedEmails.push(result);
    
    // Track email events
    if (result.success) {
      await analyticsService.trackEvent({
        id: crypto.randomUUID(),
        emailId: result.messageId || "unknown",
        recipientEmail: typeof options.to === "string" ? options.to : 
          Array.isArray(options.to) ? 
            (typeof options.to[0] === "string" ? options.to[0] : options.to[0].email) : 
            options.to.email,
        eventType: "sent",
        timestamp: new Date(),
        provider: "test",
        templateName: options.templateName,
      });
    }
    
    return result;
  };
  
  return {
    emailService,
    analyticsService,
    dependencies,
    capturedEmails,
  };
}

/**
 * Email assertion utilities
 */
export const emailAssertions = {
  /**
   * Assert that an email was sent with the given subject
   */
  emailWasSentWithSubject(emails: EmailResult[], subject: string): EmailResult {
    const email = emails.find(e => e.subject === subject);
    if (!email) {
      throw new Error(`No email was sent with subject: ${subject}`);
    }
    return email;
  },
  
  /**
   * Assert that an email was sent to the given recipient
   */
  emailWasSentTo(emails: EmailResult[], recipient: string): EmailResult {
    const email = emails.find(e => e.recipient === recipient);
    if (!email) {
      throw new Error(`No email was sent to recipient: ${recipient}`);
    }
    return email;
  },
  
  /**
   * Assert that an email was sent with the given template
   */
  emailWasSentWithTemplate(emails: EmailResult[], templateName: string): EmailResult {
    const email = emails.find(e => e.templateName === templateName);
    if (!email) {
      throw new Error(`No email was sent with template: ${templateName}`);
    }
    return email;
  },
  
  /**
   * Assert that a specific number of emails were sent
   */
  emailCountIs(emails: EmailResult[], count: number): void {
    if (emails.length !== count) {
      throw new Error(`Expected ${count} emails to be sent, but got ${emails.length}`);
    }
  },
};

/**
 * Email template validation schema
 */
export const EmailTemplateSchema = z.object({
  html: z.string(),
  text: z.string(),
});

/**
 * Validate email template HTML and text
 */
export function validateEmailTemplate(html: string, text: string): boolean {
  try {
    EmailTemplateSchema.parse({ html, text });
    
    // Check for common HTML issues
    if (!html.includes("<!DOCTYPE html>")) {
      throw new Error("HTML template is missing DOCTYPE declaration");
    }
    
    if (!html.includes("<html")) {
      throw new Error("HTML template is missing html tag");
    }
    
    if (!html.includes("<head")) {
      throw new Error("HTML template is missing head tag");
    }
    
    if (!html.includes("<body")) {
      throw new Error("HTML template is missing body tag");
    }
    
    // Check for responsive meta tag
    if (!html.includes("viewport")) {
      throw new Error("HTML template is missing viewport meta tag for responsiveness");
    }
    
    // Check for plain text alternative
    if (text.trim().length === 0) {
      throw new Error("Plain text alternative is empty");
    }
    
    return true;
  } catch (error) {
    console.error("Email template validation failed:", error);
    return false;
  }
}

/**
 * Simulate email events for testing
 */
export async function simulateEmailEvents(
  analyticsService: InMemoryEmailAnalyticsService,
  emailId: string,
  recipientEmail: string,
  events: Array<"sent" | "delivered" | "opened" | "clicked" | "bounced">
): Promise<void> {
  const now = Date.now();
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const timestamp = new Date(now + i * 1000); // Add 1 second between events
    
    switch (event) {
      case "sent":
        await analyticsService.trackEvent({
          id: crypto.randomUUID(),
          emailId,
          recipientEmail,
          eventType: "sent",
          timestamp,
          provider: "test",
        });
        break;
      case "delivered":
        await analyticsService.trackEvent({
          id: crypto.randomUUID(),
          emailId,
          recipientEmail,
          eventType: "delivered",
          timestamp,
          provider: "test",
        });
        break;
      case "opened":
        await analyticsService.trackEvent({
          id: crypto.randomUUID(),
          emailId,
          recipientEmail,
          eventType: "opened",
          timestamp,
          provider: "test",
        });
        break;
      case "clicked":
        await analyticsService.trackClickEvent({
          id: crypto.randomUUID(),
          emailId,
          recipientEmail,
          eventType: "clicked",
          timestamp,
          provider: "test",
          linkId: "test-link",
          linkUrl: "https://test.godwear.com",
        });
        break;
      case "bounced":
        await analyticsService.trackBounceEvent({
          id: crypto.randomUUID(),
          emailId,
          recipientEmail,
          eventType: "bounced",
          timestamp,
          provider: "test",
          bounceType: "hard",
          bounceReason: "Invalid recipient",
        });
        break;
    }
  }
}
