import type { EmailCampaignResult, EmailDeliveryStats } from "../../../types/email";
import { type ContactData, type ContactManagementResult } from "../../lib/mailersend";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";
export interface EmailNotification {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    recipientName?: string | undefined;
    addToContacts?: boolean;
}
export interface WelcomeEmailData {
    email: string;
    name: string;
    addToContacts?: boolean;
    customFields?: Record<string, string | number | boolean>;
}
export interface NotificationResult {
    success: boolean;
    messageId?: string | undefined;
    contactId?: string | undefined;
    error?: string | undefined;
}
export interface BulkEmailData {
    recipients: Array<{
        email: string;
        name?: string;
    }>;
    subject: string;
    htmlContent: string;
    textContent?: string;
    tags?: string[];
}
/**
 * Enhanced notification service with comprehensive MailerSend integration
 * Features: Contact management, marketing campaigns, delivery tracking, and analytics
 */
export declare class NotificationService implements BaseService {
    readonly serviceName = "notification-service";
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
        error?: string | undefined;
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
//# sourceMappingURL=notification-service.d.ts.map