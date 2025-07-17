import type { MailerSendContact } from "../../types/email";
export interface ContactData {
    email: string;
    name: string;
    customFields?: Record<string, string | number | boolean>;
}
export interface EmailDeliveryResult {
    messageId?: string | undefined;
    success: boolean;
    error?: string | undefined;
}
export interface ContactManagementResult {
    success: boolean;
    contactId?: string | undefined;
    error?: string | undefined;
}
/**
 * Enhanced MailerSend service with contact management and marketing integration
 */
export declare class MailerSendService {
    private apiKey;
    private fromEmail;
    private fromName;
    private baseUrl;
    constructor(apiKey: string, fromEmail?: string, fromName?: string);
    /**
     * Send welcome email to new user and add them to marketing contacts
     */
    sendWelcomeEmail(to: string, userName: string, addToContacts?: boolean): Promise<EmailDeliveryResult>;
    /**
     * Send email with enhanced delivery tracking
     */
    sendEmail(to: string, subject: string, htmlContent: string, textContent?: string, recipientName?: string): Promise<EmailDeliveryResult>;
    /**
     * Add contact to MailerSend for marketing purposes
     */
    addContact(contactData: ContactData): Promise<ContactManagementResult>;
    /**
     * Find contact by email address
     */
    findContactByEmail(email: string): Promise<ContactManagementResult & {
        contact?: MailerSendContact;
    }>;
    /**
     * Send marketing email to multiple recipients
     */
    sendMarketingEmail(recipients: Array<{
        email: string;
        name?: string;
    }>, subject: string, htmlContent: string, textContent?: string): Promise<EmailDeliveryResult>;
    /**
     * Get email delivery statistics
     */
    getEmailStats(messageId: string): Promise<{
        success: boolean;
        stats?: {
            delivered: number;
            opened: number;
            clicked: number;
            bounced: number;
            complained: number;
        };
        error?: string;
    }>;
    /**
     * Test MailerSend API connection and configuration
     */
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=mailersend.d.ts.map