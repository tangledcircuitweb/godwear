import { z } from "zod";
import { type ContactData, type ContactManagementResult } from "../../lib/mailersend";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";

// Define the types that will be inferred from Zod schemas in the implementation file
export type EmailNotification = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipientName?: string;
  addToContacts?: boolean;
};

export type WelcomeEmailData = {
  email: string;
  name: string;
  addToContacts?: boolean;
  customFields?: Record<string, string | number | boolean>;
};

export type NotificationResult = {
  success: boolean;
  messageId?: string;
  contactId?: string;
  error?: string;
};

export type BulkEmailData = {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
};

export type EmailCampaignResult = {
  success: boolean;
  campaignId?: string;
  messageId?: string;
  recipientCount?: number;
  error?: string;
};

export type EmailDeliveryStats = {
  messageId: string;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  timestamp: string;
};

/**
 * Enhanced notification service with comprehensive MailerSend integration
 * Features: Contact management, marketing campaigns, delivery tracking, and analytics
 */
export declare class NotificationService implements BaseService {
    readonly serviceName: string;
    
    // Static schema exports
    static readonly EmailNotificationSchema: z.ZodObject<any>;
    static readonly WelcomeEmailDataSchema: z.ZodObject<any>;
    static readonly NotificationResultSchema: z.ZodObject<any>;
    static readonly BulkEmailDataSchema: z.ZodObject<any>;
    static readonly EmailCampaignResultSchema: z.ZodObject<any>;
    static readonly EmailDeliveryStatsSchema: z.ZodObject<any>;
    
    private env;
    private logger?;
    private mailerSendService?;
    
    initialize(dependencies: ServiceDependencies): void;
    
    /**
     * Send enhanced welcome email with contact management
     */
    sendWelcomeEmail(data: WelcomeEmailData): Promise<NotificationResult>;
    
    /**
     * Send custom email notification with optional contact management
     */
    sendEmail(notification: EmailNotification): Promise<NotificationResult>;
    
    /**
     * Add contact to MailerSend for marketing purposes
     */
    addContact(contactData: ContactData): Promise<ContactManagementResult>;
    
    /**
     * Send bulk marketing email
     */
    sendBulkEmail(emailData: BulkEmailData): Promise<EmailCampaignResult>;
    
    /**
     * Get email delivery statistics
     */
    getEmailStats(messageId: string): Promise<{
        success: boolean;
        stats?: EmailDeliveryStats;
        error?: string;
    }>;
    
    /**
     * Send order confirmation email (enhanced for ecommerce)
     */
    sendOrderConfirmationEmail(email: string, orderData: {
        orderId: string;
        customerName: string;
        items: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        total: number;
        shippingAddress: string;
    }): Promise<NotificationResult>;
    
    /**
     * Send password reset email (enhanced implementation)
     */
    sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<NotificationResult>;
    
    /**
     * Get comprehensive notification statistics
     */
    getNotificationStats(): Promise<{
        totalSent: number;
        totalFailed: number;
        contactsManaged: number;
        recentActivity: Array<{
            type: string;
            recipient: string;
            status: "sent" | "failed";
            timestamp: string;
        }>;
    }>;
    
    /**
     * Test MailerSend configuration and connectivity
     */
    testEmailConfiguration(): Promise<NotificationResult>;
    
    /**
     * Enhanced health check for notification service
     */
    healthCheck(): Promise<ServiceHealthStatus>;
}