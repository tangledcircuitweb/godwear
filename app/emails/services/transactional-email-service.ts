import { z } from "zod";
import { BaseEmailService } from "./email-service";
import type { EmailResult, TemplatedEmailOptions } from "./email-service";
import { MailerSendService } from "./mailersend-service";
import { TestEmailService } from "./test-service";
import { addTrackingData } from "../utils/tracking";
import { generatePersonalizedDiscount, generateSubjectLine } from "../utils/personalization";
import type { ServiceDependencies, ServiceHealthStatus } from "../../services/base";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Local environment schema for this service - AI-First file-local approach
 * Each file defines its own environment validation schema
 */
const LocalEnvironmentSchema = z.object({
  EMAIL_MAX_RETRIES: z.string().optional(),
  EMAIL_RETRY_INITIAL_DELAY: z.string().optional(),
  EMAIL_RETRY_MAX_DELAY: z.string().optional(),
  EMAIL_RETRY_FACTOR: z.string().optional(),
  EMAIL_TEST_MODE: z.string().optional(),
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

/**
 * Welcome email options schema
 */
const WelcomeEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    userId: z.string(),
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  shopUrl: z.string().url(),
  logoUrl: z.string().url(),
  heroImageUrl: z.string().url(),
  supportEmail: z.string().email(),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
  }).optional(),
  unsubscribeUrl: z.string().url(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  campaignId: z.string().optional(),
});

/**
 * Password reset email options schema
 */
const PasswordResetEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    userId: z.string(),
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  resetUrl: z.string().url(),
  logoUrl: z.string().url(),
  supportEmail: z.string().email(),
  ipAddress: z.string(),
  device: z.string(),
  timestamp: z.string().datetime(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  campaignId: z.string().optional(),
});

/**
 * Order confirmation email options schema
 */
const OrderConfirmationEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    userId: z.string(),
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  orderNumber: z.string(),
  orderDate: z.string(),
  paymentMethod: z.string(),
  shippingMethod: z.string(),
  items: z.array(z.object({
    name: z.string(),
    variant: z.string(),
    sku: z.string(),
    quantity: z.number(),
    price: z.number(),
    imageUrl: z.string().url(),
  })),
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  discount: z.number().optional(),
  total: z.number(),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    name: z.string(),
    street: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
  estimatedDelivery: z.string(),
  trackOrderUrl: z.string().url(),
  returnsUrl: z.string().url(),
  logoUrl: z.string().url(),
  supportEmail: z.string().email(),
  unsubscribeUrl: z.string().url(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  campaignId: z.string().optional(),
});

/**
 * Shipping notification email options schema
 */
const ShippingNotificationEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    userId: z.string(),
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  orderNumber: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string().url(),
  estimatedDelivery: z.string(),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
  items: z.array(z.object({
    name: z.string(),
    variant: z.string(),
    sku: z.string(),
    quantity: z.number(),
    imageUrl: z.string().url(),
  })),
  deliveryInstructions: z.string().optional(),
  orderUrl: z.string().url(),
  logoUrl: z.string().url(),
  shippingImageUrl: z.string().url(),
  supportEmail: z.string().email(),
  unsubscribeUrl: z.string().url(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  campaignId: z.string().optional(),
});

/**
 * Abandoned cart email options schema
 */
const AbandonedCartEmailOptionsSchema = z.object({
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    userId: z.string(),
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    variant: z.string(),
    price: z.number(),
    imageUrl: z.string().url(),
  })),
  cartTotal: z.number(),
  cartUrl: z.string().url(),
  discount: z.number().optional(),
  discountCode: z.string().optional(),
  expiryHours: z.number().optional(),
  recommendations: z.array(z.object({
    name: z.string(),
    price: z.number(),
    imageUrl: z.string().url(),
    url: z.string().url(),
  })).optional(),
  logoUrl: z.string().url(),
  supportEmail: z.string().email(),
  unsubscribeUrl: z.string().url(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  campaignId: z.string().optional(),
  userSegment: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type WelcomeEmailOptions = z.infer<typeof WelcomeEmailOptionsSchema>;
export type PasswordResetEmailOptions = z.infer<typeof PasswordResetEmailOptionsSchema>;
export type OrderConfirmationEmailOptions = z.infer<typeof OrderConfirmationEmailOptionsSchema>;
export type ShippingNotificationEmailOptions = z.infer<typeof ShippingNotificationEmailOptionsSchema>;
export type AbandonedCartEmailOptions = z.infer<typeof AbandonedCartEmailOptionsSchema>;

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

/**
 * Transactional email service with specialized methods for each email type
 */
export class TransactionalEmailService extends BaseEmailService {
  override readonly serviceName = "transactional-email-service";
  private emailService!: BaseEmailService;
  private retryConfig!: RetryConfig;

  constructor() {
    super();
  }

  /**
   * Initialize the transactional email service
   */
  override initialize(dependencies: ServiceDependencies): void {
    super.initialize(dependencies);

    // Configure retry settings using AI-First file-local approach
    this.retryConfig = {
      maxRetries: Number(this.env['EMAIL_MAX_RETRIES'] || 3),
      initialDelay: Number(this.env['EMAIL_RETRY_INITIAL_DELAY'] || 1000),
      maxDelay: Number(this.env['EMAIL_RETRY_MAX_DELAY'] || 10000),
      factor: Number(this.env['EMAIL_RETRY_FACTOR'] || 2),
    };

    // Initialize the appropriate email service based on environment
    if (this.env['EMAIL_TEST_MODE'] === "true") {
      this.emailService = new TestEmailService();
    } else {
      this.emailService = new MailerSendService();
    }

    // Initialize the underlying email service
    this.emailService.initialize(dependencies);
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(options: WelcomeEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = WelcomeEmailOptionsSchema.parse(options);

      // Format name for personalization
      const name = validatedOptions.firstName || validatedOptions.recipient.name || "there";

      // Add tracking data
      const templateData = addTrackingData(
        {
          ...validatedOptions,
          name,
        },
        validatedOptions.recipient.userId,
        "account/welcome",
        validatedOptions.campaignId
      );

      // Generate subject line
      const subject = generateSubjectLine("welcome", {
        firstName: validatedOptions.firstName,
        lastName: validatedOptions.lastName,
      });

      // Send email with retry logic
      return this.sendWithRetry({
        templateName: "account/welcome",
        recipient: {
          email: validatedOptions.recipient.email,
          name: validatedOptions.recipient.name,
        },
        subject,
        data: templateData,
      });
    } catch (error) {
      this.logger?.error("Failed to send welcome email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        {
          recipient: options.recipient,
          subject: "Welcome to GodWear",
          templateName: "account/welcome",
        } as any,
        "transactional"
      );
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = PasswordResetEmailOptionsSchema.parse(options);

      // Format name for personalization
      const name = validatedOptions.firstName || validatedOptions.recipient.name || "there";

      // Add tracking data
      const templateData = addTrackingData(
        {
          ...validatedOptions,
          name,
        },
        validatedOptions.recipient.userId,
        "account/password-reset",
        validatedOptions.campaignId
      );

      // Send email with retry logic
      return this.sendWithRetry({
        templateName: "account/password-reset",
        recipient: {
          email: validatedOptions.recipient.email,
          name: validatedOptions.recipient.name,
        },
        subject: "Reset Your GodWear Password",
        data: templateData,
      });
    } catch (error) {
      this.logger?.error("Failed to send password reset email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        {
          recipient: options.recipient,
          subject: "Reset Your GodWear Password",
          templateName: "account/password-reset",
        } as any,
        "transactional"
      );
    }
  }

  /**
   * Send an order confirmation email
   */
  async sendOrderConfirmationEmail(options: OrderConfirmationEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = OrderConfirmationEmailOptionsSchema.parse(options);

      // Format name for personalization
      const name = validatedOptions.firstName || validatedOptions.recipient.name || "there";

      // Format prices for display
      const formattedOptions = {
        ...validatedOptions,
        items: validatedOptions.items.map(item => ({
          ...item,
          price: this.formatCurrency(item.price),
        })),
        subtotal: this.formatCurrency(validatedOptions.subtotal),
        shipping: this.formatCurrency(validatedOptions.shipping),
        tax: this.formatCurrency(validatedOptions.tax),
        discount: validatedOptions.discount ? this.formatCurrency(validatedOptions.discount) : undefined,
        total: this.formatCurrency(validatedOptions.total),
      };

      // Add tracking data
      const templateData = addTrackingData(
        {
          ...formattedOptions,
          name,
        },
        validatedOptions.recipient.userId,
        "orders/order-confirmation",
        validatedOptions.campaignId
      );

      // Generate subject line
      const subject = `Order Confirmed: #${validatedOptions.orderNumber} - Thank You!`;

      // Send email with high priority and retry logic
      return this.sendWithRetry({
        templateName: "orders/order-confirmation",
        recipient: {
          email: validatedOptions.recipient.email,
          name: validatedOptions.recipient.name,
        },
        subject,
        data: templateData,
        metadata: {
          priority: "high",
          orderNumber: validatedOptions.orderNumber,
          orderTotal: validatedOptions.total,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to send order confirmation email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        {
          recipient: options.recipient,
          subject: `Order Confirmed: #${options.orderNumber}`,
          templateName: "orders/order-confirmation",
        } as any,
        "transactional"
      );
    }
  }

  /**
   * Send a shipping notification email
   */
  async sendShippingNotificationEmail(options: ShippingNotificationEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = ShippingNotificationEmailOptionsSchema.parse(options);

      // Format name for personalization
      const name = validatedOptions.firstName || validatedOptions.recipient.name || "there";

      // Add tracking data
      const templateData = addTrackingData(
        {
          ...validatedOptions,
          name,
        },
        validatedOptions.recipient.userId,
        "orders/shipping-notification",
        validatedOptions.campaignId
      );

      // Generate subject line
      const subject = `Your Order #${validatedOptions.orderNumber} Has Shipped!`;

      // Send email with high priority and retry logic
      return this.sendWithRetry({
        templateName: "orders/shipping-notification",
        recipient: {
          email: validatedOptions.recipient.email,
          name: validatedOptions.recipient.name,
        },
        subject,
        data: templateData,
        metadata: {
          priority: "high",
          orderNumber: validatedOptions.orderNumber,
          trackingNumber: validatedOptions.trackingNumber,
          carrier: validatedOptions.carrier,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to send shipping notification email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        {
          recipient: options.recipient,
          subject: `Your Order #${options.orderNumber} Has Shipped!`,
          templateName: "orders/shipping-notification",
        } as any,
        "transactional"
      );
    }
  }

  /**
   * Send an abandoned cart email
   */
  async sendAbandonedCartEmail(options: AbandonedCartEmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      const validatedOptions = AbandonedCartEmailOptionsSchema.parse(options);

      // Format name for personalization
      const name = validatedOptions.firstName || validatedOptions.recipient.name || "there";

      // Generate personalized discount if not provided
      let discount = validatedOptions.discount;
      let discountCode = validatedOptions.discountCode;
      let expiryHours = validatedOptions.expiryHours || 24;

      if (!discount && !discountCode && validatedOptions.userSegment) {
        const personalized = generatePersonalizedDiscount(
          validatedOptions.recipient.userId,
          [], // Purchase history would be provided in a real implementation
          validatedOptions.userSegment,
          validatedOptions.cartTotal
        );
        
        discount = personalized.percentage;
        discountCode = personalized.code;
        expiryHours = personalized.expiryHours;
      }

      // Format prices for display
      const formattedOptions = {
        ...validatedOptions,
        items: validatedOptions.items.map(item => ({
          ...item,
          price: this.formatCurrency(item.price),
        })),
        cartTotal: this.formatCurrency(validatedOptions.cartTotal),
        recommendations: validatedOptions.recommendations?.map(item => ({
          ...item,
          price: this.formatCurrency(item.price),
        })),
        discount,
        discountCode,
        expiryHours,
      };

      // Add tracking data
      const templateData = addTrackingData(
        {
          ...formattedOptions,
          name,
        },
        validatedOptions.recipient.userId,
        "marketing/abandoned-cart",
        validatedOptions.campaignId
      );

      // Generate subject line
      const subject = discount
        ? `${name}, Save ${discount}% on Items in Your Cart`
        : `${name}, Complete Your GodWear Purchase`;

      // Send email with medium priority and retry logic
      return this.sendWithRetry({
        templateName: "marketing/abandoned-cart",
        recipient: {
          email: validatedOptions.recipient.email,
          name: validatedOptions.recipient.name,
        },
        subject,
        data: templateData,
        metadata: {
          priority: "medium",
          cartTotal: validatedOptions.cartTotal,
          itemCount: validatedOptions.items.length,
          discount,
          discountCode,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to send abandoned cart email", error as Error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        {
          recipient: options.recipient,
          subject: "Complete Your GodWear Purchase",
          templateName: "marketing/abandoned-cart",
        } as any,
        "transactional"
      );
    }
  }

  /**
   * Send a raw email (delegates to underlying email service)
   */
  async sendRawEmail(options: Parameters<BaseEmailService["sendRawEmail"]>[0]): Promise<EmailResult> {
    return this.emailService.sendRawEmail(options);
  }

  /**
   * Send a templated email (delegates to underlying email service)
   */
  async sendTemplatedEmail(options: Parameters<BaseEmailService["sendTemplatedEmail"]>[0]): Promise<EmailResult> {
    return this.emailService.sendTemplatedEmail(options);
  }

  /**
   * Send an email with retry logic
   */
  private async sendWithRetry(options: TemplatedEmailOptions): Promise<EmailResult> {
    let attempt = 0;
    let delay = this.retryConfig.initialDelay;
    let lastError: Error | null = null;

    while (attempt < this.retryConfig.maxRetries) {
      try {
        // Attempt to send the email
        const result = await this.emailService.sendTemplatedEmail(options);
        
        // If successful, return the result
        if (result.success) {
          // Log retry success if this wasn't the first attempt
          if (attempt > 0) {
            this.logger?.info(`Email sent successfully after ${attempt + 1} attempts`, {
              recipient: options.recipient.email,
              template: options.templateName,
              messageId: result.messageId,
            });
          }
          
          return result;
        }
        
        // If not successful but no error thrown, treat as an error
        lastError = new Error(result.error || "Email sending failed without specific error");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error during email sending");
        this.logger?.warn(`Email sending attempt ${attempt + 1} failed`, {
          error: lastError.message,
          recipient: options.recipient.email,
          template: options.templateName,
        });
      }
      
      // Increment attempt counter
      attempt++;
      
      // If we've reached max retries, break out of the loop
      if (attempt >= this.retryConfig.maxRetries) {
        break;
      }
      
      // Wait before the next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt with exponential backoff
      delay = Math.min(delay * this.retryConfig.factor, this.retryConfig.maxDelay);
    }
    
    // All retries failed, log and return error
    this.logger?.error(`Email sending failed after ${this.retryConfig.maxRetries} attempts`, {
      error: lastError?.message,
      recipient: options.recipient.email,
      template: options.templateName,
    });
    
    return this.createErrorResult(
      lastError?.message || "Maximum retry attempts reached",
      options,
      "transactional"
    );
  }

  /**
   * Format currency for display
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  /**
   * Resend an email
   */
  async resendEmail(emailId: string, options?: ResendOptions): Promise<EmailResult> {
    try {
      // Delegate to the underlying email service
      return await this.emailService.resendEmail(emailId, options);
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
      // Delegate to the underlying email service
      return await this.emailService.getEmailStatus(emailId);
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
      // Delegate to the underlying email service
      return await this.emailService.cancelEmail(emailId);
    } catch (error) {
      this.logger?.error("Failed to cancel email", error as Error);
      throw error;
    }
  }

  /**
   * Get health status of the email service
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    // Get health of underlying email service
    const emailServiceHealth = await this.emailService.getHealth();
    
    return {
      status: emailServiceHealth.status,
      message: emailServiceHealth.message,
      details: {
        ...emailServiceHealth.details,
        retryConfig: this.retryConfig,
        provider: this.emailService.serviceName,
      },
    };
  }
}
