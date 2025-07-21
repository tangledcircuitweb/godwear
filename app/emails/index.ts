// Re-export all email services and utilities
export * from "./services";

// Export default email service factory
import { EmailQueueService } from "./services/email-queue-service";
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
   * - "transactional": Transactional email service with specialized methods
   * - "mailersend": Direct MailerSend service
   * - "test": Test email service for development
   */
  type?: "queue" | "transactional" | "mailersend" | "test";
  
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
      service = new EmailQueueService();
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
