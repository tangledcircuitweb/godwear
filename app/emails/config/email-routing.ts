import { z } from "zod";

// ============================================================================
// EMAIL ROUTING CONFIGURATION
// ============================================================================

/**
 * Email routing configuration schema
 */
const EmailRoutingConfigSchema = z.object({
  // Test mode settings
  testMode: z.boolean().default(false),
  testRecipient: z.string().email({}).optional(),
  
  // Environment-based routing
  environment: z.enum(["development", "staging", "production"]).default("development"),
  
  // Override settings
  overrideAllEmails: z.boolean().default(false),
  overrideRecipient: z.string().email({}).optional(),
  
  // Allowed domains for production
  allowedDomains: z.array(z.string()).default([]),
  
  // Email prefixes for different environments
  subjectPrefix: z.string().optional(),
});

export type EmailRoutingConfig = z.infer<typeof EmailRoutingConfigSchema>;

/**
 * Default email routing configuration - ALL EMAILS GO TO njordrenterprises@gmail.com
 */
export const DEFAULT_EMAIL_ROUTING: EmailRoutingConfig = {
  testMode: true,
  testRecipient: "njordrenterprises@gmail.com",
  environment: "development",
  overrideAllEmails: true,
  overrideRecipient: "njordrenterprises@gmail.com",
  allowedDomains: ["godwear.ca", "godwear.com"],
  subjectPrefix: "[GodWear Test]",
};

/**
 * Email routing service for testing and development
 */
export class EmailRoutingService {
  private config: EmailRoutingConfig;

  constructor(config: Partial<EmailRoutingConfig> = {}) {
    this.config = EmailRoutingConfigSchema.parse({
      ...DEFAULT_EMAIL_ROUTING,
      ...config,
    });
  }

  /**
   * Process recipient email based on routing configuration
   */
  processRecipient(originalEmail: string, originalName?: string): {
    email: string;
    name?: string;
    isRouted: boolean;
    originalEmail: string;
  } {
    // If override is enabled, route to override recipient
    if (this.config.overrideAllEmails && this.config.overrideRecipient) {
      return {
        email: this.config.overrideRecipient,
        name: originalName ? `${originalName} (${originalEmail})` : `Test Recipient (${originalEmail})`,
        isRouted: true,
        originalEmail,
      };
    }

    // If test mode is enabled, route to test recipient
    if (this.config.testMode && this.config.testRecipient) {
      return {
        email: this.config.testRecipient,
        name: originalName ? `${originalName} (${originalEmail})` : `Test Recipient (${originalEmail})`,
        isRouted: true,
        originalEmail,
      };
    }

    // In production, check allowed domains
    if (this.config.environment === "production") {
      const emailDomain = originalEmail.split("@")[1];
      if (this.config.allowedDomains.length > 0 && !this.config.allowedDomains.includes(emailDomain)) {
        // Route to test recipient if domain not allowed
        if (this.config.testRecipient) {
          return {
            email: this.config.testRecipient,
            name: originalName ? `${originalName} (${originalEmail})` : `Test Recipient (${originalEmail})`,
            isRouted: true,
            originalEmail,
          };
        }
      }
    }

    // Return original email if no routing needed
    return {
      email: originalEmail,
      name: originalName,
      isRouted: false,
      originalEmail,
    };
  }

  /**
   * Process email subject based on routing configuration
   */
  processSubject(originalSubject: string, isRouted: boolean): string {
    let subject = originalSubject;

    // Add environment prefix if configured
    if (this.config.subjectPrefix) {
      subject = `${this.config.subjectPrefix} ${subject}`;
    }

    // Add routing indicator if email was routed
    if (isRouted) {
      subject = `[ROUTED] ${subject}`;
    }

    return subject;
  }

  /**
   * Get current routing configuration
   */
  getConfig(): EmailRoutingConfig {
    return { ...this.config };
  }

  /**
   * Update routing configuration
   */
  updateConfig(updates: Partial<EmailRoutingConfig>): void {
    this.config = EmailRoutingConfigSchema.parse({
      ...this.config,
      ...updates,
    });
  }

  /**
   * Enable test mode with specific recipient
   */
  enableTestMode(testRecipient: string): void {
    this.updateConfig({
      testMode: true,
      testRecipient,
      overrideAllEmails: true,
      overrideRecipient: testRecipient,
    });
  }

  /**
   * Disable test mode
   */
  disableTestMode(): void {
    this.updateConfig({
      testMode: false,
      overrideAllEmails: false,
    });
  }

  /**
   * Set environment
   */
  setEnvironment(environment: "development" | "staging" | "production"): void {
    this.updateConfig({ environment });
  }

  /**
   * Check if email routing is active
   */
  isRoutingActive(): boolean {
    return this.config.testMode || this.config.overrideAllEmails;
  }

  /**
   * Get routing status information
   */
  getRoutingStatus(): {
    active: boolean;
    mode: string;
    recipient?: string;
    environment: string;
  } {
    return {
      active: this.isRoutingActive(),
      mode: this.config.testMode ? "test" : this.config.overrideAllEmails ? "override" : "normal",
      recipient: this.config.overrideRecipient || this.config.testRecipient,
      environment: this.config.environment,
    };
  }
}

/**
 * Create email routing service with environment-based configuration
 */
export function createEmailRoutingService(env?: any): EmailRoutingService {
  const environment = env?.NODE_ENV || "development";
  const testRecipient = env?.TEST_EMAIL_RECIPIENT || "njordrenterprises@gmail.com";
  
  return new EmailRoutingService({
    environment: environment === "production" ? "production" : "development",
    testMode: environment !== "production",
    testRecipient,
    overrideAllEmails: environment !== "production",
    overrideRecipient: testRecipient,
    subjectPrefix: environment === "production" ? undefined : `[GodWear ${environment.toUpperCase()}]`,
  });
}

// Export schemas for validation
export { EmailRoutingConfigSchema };
