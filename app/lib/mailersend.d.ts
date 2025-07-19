import { z } from "zod";

// Define the schemas in the implementation file and reference them here
export type MailerSendPayload = {
  from: {
    email: string;
    name: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  html: string;
  text: string;
  reply_to?: {
    email: string;
    name: string;
  };
  settings?: {
    track_clicks?: boolean;
    track_opens?: boolean;
    track_content?: boolean;
  };
  tags?: string[];
};

export type MailerSendContact = {
  id: string;
  email: string;
  name?: string;
  status: "active" | "unsubscribed" | "bounced" | "complained";
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, string | number | boolean>;
};

export type ContactData = {
  email: string;
  name: string;
  customFields?: Record<string, string | number | boolean>;
};

export type EmailDeliveryResult = {
  messageId?: string;
  success: boolean;
  error?: string;
};

export type ContactManagementResult = {
  success: boolean;
  contactId?: string;
  error?: string;
};

/**
 * Enhanced MailerSend service with contact management and marketing integration
 */
export declare class MailerSendService {
    private apiKey;
    private fromEmail;
    private fromName;
    private baseUrl;

    // Static schema exports
    static readonly MailerSendPayloadSchema: z.ZodObject<any>;
    static readonly MailerSendContactSchema: z.ZodObject<any>;
    static readonly MailerSendContactResponseSchema: z.ZodObject<any>;
    static readonly MailerSendListResponseSchema: z.ZodObject<any>;
    static readonly ContactDataSchema: z.ZodObject<any>;
    static readonly EmailDeliveryResultSchema: z.ZodObject<any>;
    static readonly ContactManagementResultSchema: z.ZodObject<any>;

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