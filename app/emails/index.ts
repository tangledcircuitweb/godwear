// Re-export all email services and utilities
export * from "./services";
export * from "./analytics";

// Export types for external use
export type { BaseEmailService } from "./services/email-service";
export type { ServiceDependencies } from "../services/base";

// Export common email types
export type {
  EmailRecipient,
  EmailAttachment,
  RawEmailOptions,
  TemplatedEmailOptions,
  EmailResult,
} from "./services/email-service";

// Export queue-specific types
export type {
  EmailPriority,
  QueueItemStatus,
} from "./services/email-queue-service";

// Export analytics types
export type {
  EmailEvent,
  EmailEventType,
  EmailAnalyticsMetrics,
  EmailAnalyticsQuery,
  EmailAnalyticsMetricsQuery,
  EmailAnalyticsResult,
  EmailAnalyticsMetricsResult,
} from "./analytics/email-analytics-service";

// Export default email service factory
import { EmailQueueService } from "./services/email-queue-service";
import { EnhancedEmailQueueService } from "./services/enhanced-queue-service";
import { MailerSendService } from "./services/mailersend-service";
import { TestEmailService } from "./services/test-service";
import { TransactionalEmailService } from "./services/transactional-email-service";
import type { BaseEmailService } from "./services/email-service";
import type { ServiceDependencies } from "../services/base";

/**
 * Email service factory options
 */
export interface EmailServiceFactoryOptions {
  /**
   * Type of email service to create
   * - "queue": Email queue service with scheduling and rate limiting
   * - "enhanced-queue": Enhanced email queue service with advanced scheduling and prioritization
   * - "transactional": Transactional email service with specialized methods
   * - "mailersend": Direct MailerSend service
   * - "test": Test email service for development
   */
  type?: "queue" | "enhanced-queue" | "transactional" | "mailersend" | "test";
  
  /**
   * Service dependencies
   */
  dependencies: ServiceDependencies;
}

/**
 * Create an email service instance based on options
 */
export function createEmailService(options: EmailServiceFactoryOptions): BaseEmailService {
  const { type = "queue", dependencies } = options;
  
  let service: BaseEmailService;
  
  switch (type) {
    case "queue":
      // Create a transactional service as the base for the queue
      const baseService = new TransactionalEmailService();
      service = new EmailQueueService(baseService);
      break;
    case "enhanced-queue":
      service = new EnhancedEmailQueueService();
      break;
    case "transactional":
      service = new TransactionalEmailService();
      break;
    case "mailersend":
      service = new MailerSendService();
      break;
    case "test":
      service = new TestEmailService();
      break;
    default:
      throw new Error(`Unknown email service type: ${type}`);
  }
  
  service.initialize(dependencies);
  return service;
}
