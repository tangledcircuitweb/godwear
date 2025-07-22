import { z } from "zod";
import { MailerSendService } from "../services/mailersend-service";
import { TransactionalEmailService } from "../services/transactional-email-service";
import { EnhancedEmailQueueService } from "../services/enhanced-queue-service";
import type { EmailResult, RawEmailOptions, TemplatedEmailOptions } from "../services/email-service";
import type { ServiceDependencies } from "../../services/base";
import type { EmailEvent } from "../analytics/types";

/**
 * Live email test environment configuration
 */
export interface LiveEmailTestEnvironment {
  /**
   * Real MailerSend service for sending emails
   */
  mailerSendService: MailerSendService;
  
  /**
   * Transactional email service with real backend
   */
  transactionalService: TransactionalEmailService;
  
  /**
   * Enhanced queue service for timed email sending
   */
  queueService: EnhancedEmailQueueService;
  
  /**
   * Service dependencies with live configuration
   */
  dependencies: ServiceDependencies;
  
  /**
   * Test recipient email (njordrenterprises@gmail.com)
   */
  testRecipient: string;
  
  /**
   * Verified from email domain
   */
  fromEmail: string;
  
  /**
   * Captured email results for verification
   */
  sentEmails: EmailResult[];
  
  /**
   * Email send timing tracker
   */
  emailTimings: Array<{ emailId: string; sentAt: Date; subject: string }>;
}

/**
 * Create a live email test environment
 */
export function createLiveEmailTestEnvironment(): LiveEmailTestEnvironment {
  console.log("🚀 Initializing live email test environment...");
  
  // Create live service dependencies
  const dependencies: ServiceDependencies = {
    env: {
      // MailerSend configuration with verified domain
      MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY || "mlsn.7916d885f9a0218a0499fcf4a2ba543e4b157daf77592f15ad000e0f8776bb7e",
      MAILERSEND_FROM_EMAIL: "noreply@godwear.ca", // Verified domain
      MAILERSEND_FROM_NAME: "GodWear Test System",
      MAILERSEND_BASE_URL: "https://api.mailersend.com/v1",
      
      // Base configuration
      BASE_URL: "https://godwear.ca",
      LOGO_URL: "https://godwear.ca/images/logo.png",
      SUPPORT_EMAIL: "support@godwear.ca",
      
      // Queue configuration for configurable timing intervals
      EMAIL_QUEUE_MAX_CONCURRENT: "1", // Send one at a time for testing
      EMAIL_QUEUE_BATCH_SIZE: "1",
      EMAIL_QUEUE_RATE_CRITICAL: "0",
      EMAIL_QUEUE_RATE_HIGH: "1", 
      EMAIL_QUEUE_RATE_MEDIUM: "1", 
      EMAIL_QUEUE_RATE_LOW: "1", 
      
      // Configurable email timing intervals (in milliseconds)
      EMAIL_INTERVAL_CRITICAL: "0",     // No delay for critical emails
      EMAIL_INTERVAL_HIGH: "5000",      // 5 seconds between high priority emails
      EMAIL_INTERVAL_MEDIUM: "30000",   // 30 seconds between medium priority emails
      EMAIL_INTERVAL_LOW: "60000",      // 1 minute between low priority emails
      EMAIL_INTERVAL_TESTING: "60000",  // 1 minute for testing mode (configurable)
      
      // Enable testing mode for consistent timing
      EMAIL_TESTING_MODE: "true",
      
      // Test configuration
      LIVE_EMAIL_TESTING: "true",
      TEST_RECIPIENT_EMAIL: "njordrenterprises@gmail.com",
    },
    logger: {
      debug: (msg: string, ...args: any[]) => console.log(`🔍 [DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.log(`ℹ️  [INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`⚠️  [WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`❌ [ERROR] ${msg}`, ...args),
    },
  } as ServiceDependencies;
  
  // Initialize real services
  const mailerSendService = new MailerSendService();
  mailerSendService.initialize(dependencies);
  
  const transactionalService = new TransactionalEmailService();
  transactionalService.initialize(dependencies);
  
  const queueService = new EnhancedEmailQueueService(transactionalService);
  queueService.initialize(dependencies);
  
  // Arrays to track sent emails and timings
  const sentEmails: EmailResult[] = [];
  const emailTimings: Array<{ emailId: string; sentAt: Date; subject: string }> = [];
  
  const testRecipient = "njordrenterprises@gmail.com";
  const fromEmail = "noreply@godwear.ca";
  
  console.log("✅ Live email test environment initialized");
  console.log(`📧 Test recipient: ${testRecipient}`);
  console.log(`📤 From email: ${fromEmail}`);
  console.log("⏱️  Queue configured for 1-minute intervals");
  
  return {
    mailerSendService,
    transactionalService,
    queueService,
    dependencies,
    testRecipient,
    fromEmail,
    sentEmails,
    emailTimings,
  };
}

/**
 * Live email assertion utilities
 */
export const liveEmailAssertions = {
  /**
   * Wait for email to be sent and verify result
   */
  async waitForEmailSent(
    emailPromise: Promise<EmailResult>,
    expectedSubject?: string
  ): Promise<EmailResult> {
    console.log("⏳ Waiting for email to be sent...");
    
    const result = await emailPromise;
    
    if (!result.success) {
      throw new Error(`Email send failed: ${result.error}`);
    }
    
    if (expectedSubject && result.subject !== expectedSubject) {
      throw new Error(`Expected subject "${expectedSubject}" but got "${result.subject}"`);
    }
    
    console.log(`✅ Email sent successfully: ${result.subject}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Recipient: ${result.recipient}`);
    
    return result;
  },
  
  /**
   * Verify email was sent to correct recipient
   */
  verifyRecipient(result: EmailResult, expectedRecipient: string): void {
    if (result.recipient !== expectedRecipient) {
      throw new Error(`Expected recipient "${expectedRecipient}" but got "${result.recipient}"`);
    }
    console.log(`✅ Email sent to correct recipient: ${expectedRecipient}`);
  },
  
  /**
   * Verify timing between emails (should be ~1 minute apart)
   */
  verifyEmailTiming(
    timings: Array<{ emailId: string; sentAt: Date; subject: string }>,
    expectedIntervalMinutes: number = 1
  ): void {
    if (timings.length < 2) {
      console.log("ℹ️  Not enough emails sent to verify timing");
      return;
    }
    
    for (let i = 1; i < timings.length; i++) {
      const prevTime = timings[i - 1].sentAt;
      const currentTime = timings[i].sentAt;
      const intervalMs = currentTime.getTime() - prevTime.getTime();
      const intervalMinutes = intervalMs / (1000 * 60);
      
      console.log(`⏱️  Interval between emails: ${intervalMinutes.toFixed(2)} minutes`);
      
      // Allow some tolerance (±30 seconds)
      const tolerance = 0.5; // 30 seconds
      if (Math.abs(intervalMinutes - expectedIntervalMinutes) > tolerance) {
        console.warn(`⚠️  Email timing outside expected range: ${intervalMinutes.toFixed(2)} minutes (expected ~${expectedIntervalMinutes} minutes)`);
      } else {
        console.log(`✅ Email timing within expected range`);
      }
    }
  },
  
  /**
   * Log email send summary
   */
  logEmailSummary(sentEmails: EmailResult[]): void {
    console.log(`\n📊 Email Send Summary:`);
    console.log(`📧 Total emails sent: ${sentEmails.length}`);
    console.log(`✅ Successful sends: ${sentEmails.filter(e => e.success).length}`);
    console.log(`❌ Failed sends: ${sentEmails.filter(e => !e.success).length}`);
    
    if (sentEmails.length > 0) {
      console.log(`\n📋 Email Details:`);
      sentEmails.forEach((email, index) => {
        const status = email.success ? "✅" : "❌";
        console.log(`  ${index + 1}. ${status} ${email.subject} (${email.recipient})`);
        if (email.messageId) {
          console.log(`     📧 ID: ${email.messageId}`);
        }
        if (!email.success && email.error) {
          console.log(`     ❌ Error: ${email.error}`);
        }
      });
    }
  }
};

/**
 * Create test email data with live recipient
 */
export function createTestEmailData(
  type: "order-confirmation" | "shipping-notification" | "password-reset" | "welcome" | "marketing",
  customData?: any
) {
  const baseData = {
    recipient: {
      email: "njordrenterprises@gmail.com",
      name: "Test Recipient",
      userId: "test-user-123",
    },
    timestamp: new Date().toISOString(),
  };
  
  switch (type) {
    case "order-confirmation":
      return {
        ...baseData,
        orderId: "test-order-" + Date.now(),
        orderNumber: "ORD-" + Date.now(),
        orderDate: new Date(),
        customerId: "test-customer-123",
        customerEmail: "njordrenterprises@gmail.com",
        customerName: "Test Recipient",
        items: [
          {
            id: "item-1",
            productId: "product-1",
            name: "GodWear Performance T-Shirt",
            sku: "GW-TS-001-M-BLK",
            variant: "Medium / Black",
            quantity: 1,
            price: 39.99,
            imageUrl: "https://godwear.ca/images/products/performance-tshirt.jpg",
          },
        ],
        subtotal: 39.99,
        shipping: 9.99,
        tax: 5.00,
        total: 54.98,
        shippingAddress: {
          name: "Test Recipient",
          street: "123 Test Street",
          city: "Test City",
          state: "TC",
          zip: "12345",
          country: "Canada",
        },
        billingAddress: {
          name: "Test Recipient", 
          street: "123 Test Street",
          city: "Test City",
          state: "TC",
          zip: "12345",
          country: "Canada",
        },
        shippingMethod: "Standard Shipping",
        paymentDetails: {
          method: "credit_card",
          cardLast4: "1234",
          cardBrand: "Visa",
        },
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        ...customData,
      };
      
    case "shipping-notification":
      return {
        ...baseData,
        orderId: "test-order-" + Date.now(),
        orderNumber: "ORD-" + Date.now(),
        trackingNumber: "TRK-" + Date.now(),
        carrier: "Test Shipping Co",
        trackingUrl: "https://testshipping.com/track/TRK-" + Date.now(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        items: [
          {
            name: "GodWear Performance T-Shirt",
            quantity: 1,
            imageUrl: "https://godwear.ca/images/products/performance-tshirt.jpg",
          },
        ],
        shippingAddress: {
          name: "Test Recipient",
          street: "123 Test Street", 
          city: "Test City",
          state: "TC",
          zip: "12345",
          country: "Canada",
        },
        ...customData,
      };
      
    case "password-reset":
      return {
        ...baseData,
        resetToken: "test-reset-token-" + Date.now(),
        resetUrl: "https://godwear.ca/reset-password?token=test-reset-token-" + Date.now(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        ...customData,
      };
      
    case "welcome":
      return {
        ...baseData,
        firstName: "Test",
        verificationUrl: "https://godwear.ca/verify?token=test-verify-token-" + Date.now(),
        ...customData,
      };
      
    case "marketing":
      return {
        ...baseData,
        campaignName: "Test Marketing Campaign",
        subject: "🔥 Special Offer - Live Email Test",
        preheader: "This is a live email test from GodWear",
        unsubscribeUrl: "https://godwear.ca/unsubscribe?email=njordrenterprises@gmail.com",
        ...customData,
      };
      
    default:
      return baseData;
  }
}

/**
 * Send test email with timing tracking
 */
export async function sendTestEmailWithTiming(
  testEnv: LiveEmailTestEnvironment,
  emailType: string,
  emailPromise: Promise<EmailResult>
): Promise<EmailResult> {
  const startTime = new Date();
  console.log(`⏰ [${startTime.toISOString()}] Sending ${emailType} email...`);
  
  try {
    const result = await emailPromise;
    
    // Track the email result
    testEnv.sentEmails.push(result);
    
    // Track timing if successful
    if (result.success && result.messageId) {
      testEnv.emailTimings.push({
        emailId: result.messageId,
        sentAt: startTime,
        subject: result.subject || emailType,
      });
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    if (result.success) {
      console.log(`✅ [${endTime.toISOString()}] ${emailType} email sent successfully (${duration}ms)`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${result.recipient}`);
    } else {
      console.error(`❌ [${endTime.toISOString()}] ${emailType} email failed (${duration}ms)`);
      console.error(`Error: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.error(`💥 [${endTime.toISOString()}] ${emailType} email threw error (${duration}ms):`, error);
    throw error;
  }
}

/**
 * Configure email timing intervals for testing
 */
export function configureEmailTiming(
  testEnv: LiveEmailTestEnvironment,
  intervals: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    testing?: number;
  }
): void {
  console.log("⚙️  Configuring email timing intervals...");
  
  // Update environment variables for timing
  if (intervals.critical !== undefined) {
    testEnv.dependencies.env.EMAIL_INTERVAL_CRITICAL = intervals.critical.toString();
  }
  if (intervals.high !== undefined) {
    testEnv.dependencies.env.EMAIL_INTERVAL_HIGH = intervals.high.toString();
  }
  if (intervals.medium !== undefined) {
    testEnv.dependencies.env.EMAIL_INTERVAL_MEDIUM = intervals.medium.toString();
  }
  if (intervals.low !== undefined) {
    testEnv.dependencies.env.EMAIL_INTERVAL_LOW = intervals.low.toString();
  }
  if (intervals.testing !== undefined) {
    testEnv.dependencies.env.EMAIL_INTERVAL_TESTING = intervals.testing.toString();
  }
  
  // Log the configuration
  console.log("📊 Email timing intervals configured:");
  console.log(`  Critical: ${testEnv.dependencies.env.EMAIL_INTERVAL_CRITICAL}ms`);
  console.log(`  High: ${testEnv.dependencies.env.EMAIL_INTERVAL_HIGH}ms`);
  console.log(`  Medium: ${testEnv.dependencies.env.EMAIL_INTERVAL_MEDIUM}ms`);
  console.log(`  Low: ${testEnv.dependencies.env.EMAIL_INTERVAL_LOW}ms`);
  console.log(`  Testing: ${testEnv.dependencies.env.EMAIL_INTERVAL_TESTING}ms`);
  console.log(`  Testing Mode: ${testEnv.dependencies.env.EMAIL_TESTING_MODE}`);
}

/**
 * Wait for specified interval between emails (for queue testing)
 */
export async function waitForInterval(minutes: number = 1): Promise<void> {
  const ms = minutes * 60 * 1000;
  console.log(`⏳ Waiting ${minutes} minute(s) before next email...`);
  
  // Show countdown
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = ms - elapsed;
    
    if (remaining <= 0) {
      clearInterval(interval);
      return;
    }
    
    const remainingSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    process.stdout.write(`\r⏱️  Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, 1000);
  
  await new Promise(resolve => setTimeout(resolve, ms));
  process.stdout.write('\n');
  console.log(`✅ Wait complete - ready for next email`);
}

/**
 * Wait for specified milliseconds (for showcase testing)
 */
export async function waitForMilliseconds(ms: number): Promise<void> {
  if (ms <= 0) return;
  
  const seconds = ms / 1000;
  console.log(`⏳ Waiting ${seconds}s before next email...`);
  
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Email template validation for live testing
 */
export const EmailTemplateSchema = z.object({
  html: z.string().min(1, "HTML content cannot be empty"),
  text: z.string().min(1, "Text content cannot be empty"),
});

/**
 * Validate email template for live sending
 */
export function validateEmailTemplate(html: string, text: string): boolean {
  try {
    EmailTemplateSchema.parse({ html, text });
    
    // Additional validation for live emails
    if (!html.includes("njordrenterprises@gmail.com") && !html.includes("Test Recipient")) {
      console.warn("⚠️  Email template may not be configured for test recipient");
    }
    
    // Check for required HTML structure
    const requiredElements = ["<!DOCTYPE html>", "<html", "<head", "<body"];
    for (const element of requiredElements) {
      if (!html.includes(element)) {
        throw new Error(`HTML template is missing required element: ${element}`);
      }
    }
    
    // Check for responsive design
    if (!html.includes("viewport")) {
      console.warn("⚠️  HTML template may not be mobile-responsive (missing viewport meta tag)");
    }
    
    console.log("✅ Email template validation passed");
    return true;
    
  } catch (error) {
    console.error("❌ Email template validation failed:", error);
    return false;
  }
}
