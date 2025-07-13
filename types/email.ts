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
}
