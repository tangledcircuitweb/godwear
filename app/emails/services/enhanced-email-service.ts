import { z } from "zod";
import { MailerSendService } from "./mailersend-service";
import { EmailRoutingService, createEmailRoutingService } from "../config/email-routing";
import type { EmailResult, TemplatedEmailOptions } from "./email-service";

// ============================================================================
// ENHANCED EMAIL SERVICE WITH ROUTING
// ============================================================================

/**
 * Enhanced email service that integrates routing for testing
 */
export class EnhancedEmailService {
  private mailerSendService: MailerSendService;
  private routingService: EmailRoutingService;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.mailerSendService = new MailerSendService(env);
    this.routingService = createEmailRoutingService(env);
  }

  /**
   * Send templated email with routing
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult> {
    try {
      // Process recipient through routing
      const routedRecipient = this.routingService.processRecipient(
        options.recipient.email,
        options.recipient.name
      );

      // Process subject through routing
      const routedSubject = this.routingService.processSubject(
        options.subject,
        routedRecipient.isRouted
      );

      // Add routing information to template data
      const enhancedData = {
        ...options.data,
        routing: {
          isRouted: routedRecipient.isRouted,
          originalEmail: routedRecipient.originalEmail,
          routedTo: routedRecipient.email,
        },
        currentYear: new Date().getFullYear(),
      };

      // Create enhanced options
      const enhancedOptions: TemplatedEmailOptions = {
        ...options,
        recipient: {
          email: routedRecipient.email,
          name: routedRecipient.name,
        },
        subject: routedSubject,
        data: enhancedData,
      };

      // Log routing information
      if (routedRecipient.isRouted) {
        console.log(`📧 Email routed: ${routedRecipient.originalEmail} → ${routedRecipient.email}`);
        console.log(`📧 Subject: ${routedSubject}`);
        console.log(`📧 Template: ${options.templateName}`);
      }

      // Send email through MailerSend
      return await this.mailerSendService.sendTemplatedEmail(enhancedOptions);
    } catch (error) {
      console.error("Enhanced email service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "enhanced-email-service",
        recipient: options.recipient.email,
        subject: options.subject,
      };
    }
  }

  /**
   * Send order confirmation email with routing
   */
  async sendOrderConfirmationEmail(data: {
    recipient: { email: string; name?: string; userId: string };
    firstName?: string;
    orderNumber: string;
    orderDate: string;
    paymentMethod: string;
    shippingMethod: string;
    items: Array<{
      name: string;
      variant: string;
      sku: string;
      quantity: number;
      price: number;
      imageUrl: string;
    }>;
    subtotal: number;
    shipping: number;
    tax: number;
    discount?: number;
    total: number;
    shippingAddress: any;
    billingAddress: any;
    estimatedDelivery: string;
    trackOrderUrl: string;
    returnsUrl: string;
    logoUrl: string;
    supportEmail: string;
    unsubscribeUrl: string;
    privacyUrl: string;
    termsUrl: string;
    campaignId: string;
  }): Promise<EmailResult> {
    return this.sendTemplatedEmail({
      templateName: "orders/order-confirmation",
      recipient: data.recipient,
      subject: `🙏 Your Blessed Order Confirmation - #${data.orderNumber}`,
      data,
    });
  }

  /**
   * Send shipping notification email with routing
   */
  async sendShippingNotificationEmail(data: {
    recipient: { email: string; name?: string; userId: string };
    name: string;
    orderNumber: string;
    trackingNumber: string;
    carrier: string;
    shipDate: string;
    expectedDelivery: string;
    shippingAddress: any;
    trackingUrl: string;
    supportEmail: string;
    logoUrl: string;
    unsubscribeUrl: string;
    privacyUrl: string;
    termsUrl: string;
  }): Promise<EmailResult> {
    return this.sendTemplatedEmail({
      templateName: "orders/shipping-notification",
      recipient: data.recipient,
      subject: `🚚 Your Blessed Order is On Its Way - #${data.orderNumber}`,
      data,
    });
  }

  /**
   * Send welcome email with routing
   */
  async sendWelcomeEmail(data: {
    recipient: { email: string; name?: string; userId: string };
    name: string;
    shopUrl: string;
    logoUrl: string;
    supportEmail: string;
    unsubscribeUrl: string;
    privacyUrl: string;
    termsUrl: string;
  }): Promise<EmailResult> {
    return this.sendTemplatedEmail({
      templateName: "account/welcome",
      recipient: data.recipient,
      subject: "🙏 Welcome to the GodWear Family - Where Faith Meets Fashion",
      data,
    });
  }

  /**
   * Send abandoned cart email with routing
   */
  async sendAbandonedCartEmail(data: {
    recipient: { email: string; name?: string; userId: string };
    name: string;
    cartItems: Array<{
      name: string;
      variant: string;
      quantity: number;
      price: string;
      imageUrl: string;
    }>;
    cartTotal: string;
    cartUrl: string;
    supportEmail: string;
    logoUrl: string;
    unsubscribeUrl: string;
    privacyUrl: string;
    termsUrl: string;
  }): Promise<EmailResult> {
    return this.sendTemplatedEmail({
      templateName: "marketing/abandoned-cart",
      recipient: data.recipient,
      subject: "🛍️ Your Blessed Items Are Waiting - Complete Your Faith Journey",
      data,
    });
  }

  /**
   * Get routing status
   */
  getRoutingStatus() {
    return this.routingService.getRoutingStatus();
  }

  /**
   * Enable test mode
   */
  enableTestMode(testRecipient: string) {
    this.routingService.enableTestMode(testRecipient);
  }

  /**
   * Disable test mode
   */
  disableTestMode() {
    this.routingService.disableTestMode();
  }

  /**
   * Test email connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.mailerSendService.testConnection();
  }

  /**
   * Send test email to verify routing
   */
  async sendTestEmail(originalRecipient: string = "customer@example.com"): Promise<EmailResult> {
    const testData = {
      recipient: {
        email: originalRecipient,
        name: "Test Customer",
        userId: "test-user-123",
      },
      name: "Test Customer",
      message: "This is a test email to verify the Christian-branded email templates and routing system.",
      logoUrl: "https://godwear.ca/logo.png",
      supportEmail: this.env.SUPPORT_EMAIL || "njordrenterprises@gmail.com",
      unsubscribeUrl: "https://godwear.ca/unsubscribe",
      privacyUrl: "https://godwear.ca/privacy",
      termsUrl: "https://godwear.ca/terms",
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplatedEmail({
      templateName: "test/routing-test",
      recipient: testData.recipient,
      subject: "🙏 GodWear Email System Test - Christian Branding Verification",
      data: testData,
    });
  }
}

/**
 * Create enhanced email service with environment configuration
 */
export function createEnhancedEmailService(env: any): EnhancedEmailService {
  return new EnhancedEmailService(env);
}

// Export for use in other parts of the application
export { EmailRoutingService, createEmailRoutingService };
