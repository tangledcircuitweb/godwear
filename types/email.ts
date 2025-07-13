export interface EmailRequest {
  email: string;
  name: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface MailerSendPayload {
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
}

// MailerSend Contact Management Types
export interface MailerSendContact {
  id: string;
  email: string;
  name?: string;
  status: "active" | "unsubscribed" | "bounced" | "complained";
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, string | number | boolean>;
}

export interface MailerSendContactResponse {
  data?: {
    id: string;
    email: string;
    name?: string;
    status: string;
    created_at: string;
  };
  message?: string;
}

export interface MailerSendListResponse<T> {
  data?: T[];
  links?: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Enhanced Email Service Types
export interface EmailDeliveryStats {
  messageId: string;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  timestamp: string;
}

export interface MarketingEmailData {
  recipients: Array<{
    email: string;
    name?: string;
    customFields?: Record<string, string | number | boolean>;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  listId?: string;
  tags?: string[];
}

export interface EmailCampaignResult {
  success: boolean;
  campaignId?: string | undefined;
  messageId?: string | undefined;
  recipientCount?: number;
  error?: string | undefined;
}

// Contact List Management
export interface ContactListData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface ContactListResult {
  success: boolean;
  listId?: string;
  error?: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  category: "welcome" | "marketing" | "transactional" | "notification";
}

export interface TemplateVariable {
  name: string;
  value: string | number | boolean;
  required: boolean;
}
