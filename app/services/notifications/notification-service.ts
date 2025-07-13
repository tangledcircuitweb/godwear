import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../base";
import type { CloudflareBindings } from "../../../types/cloudflare";
import { MailerSendService } from "../../lib/mailersend";

export interface EmailNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipientName?: string;
}

export interface WelcomeEmailData {
  email: string;
  name: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Notification service handling email and other notification types
 */
export class NotificationService implements BaseService {
  readonly serviceName = 'notification-service';
  
  private env!: CloudflareBindings;
  private logger?: any;
  private mailerSendService?: MailerSendService;

  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
    
    // Initialize MailerSend service if API key is available
    if (this.env.MAILERSEND_API_KEY) {
      this.mailerSendService = new MailerSendService(this.env.MAILERSEND_API_KEY);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<NotificationResult> {
    if (!this.mailerSendService) {
      const error = 'MailerSend service not configured';
      this.logger?.error(error);
      return { success: false, error };
    }

    try {
      await this.mailerSendService.sendWelcomeEmail(data.email, data.name);
      
      this.logger?.info('Welcome email sent successfully', {
        recipient: data.email,
        name: data.name,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Welcome email failed', error as Error, {
        recipient: data.email,
        name: data.name,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send custom email notification
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    if (!this.mailerSendService) {
      const error = 'MailerSend service not configured';
      this.logger?.error(error);
      return { success: false, error };
    }

    try {
      await this.mailerSendService.sendEmail(
        notification.to,
        notification.subject,
        notification.htmlContent,
        notification.textContent,
        notification.recipientName
      );

      this.logger?.info('Email sent successfully', {
        recipient: notification.to,
        subject: notification.subject,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Email sending failed', error as Error, {
        recipient: notification.to,
        subject: notification.subject,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email (future implementation)
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<NotificationResult> {
    // This would be implemented when password reset functionality is added
    this.logger?.info('Password reset email requested', { email });
    
    return {
      success: false,
      error: 'Password reset functionality not yet implemented',
    };
  }

  /**
   * Send order confirmation email (future implementation)
   */
  async sendOrderConfirmationEmail(email: string, orderData: any): Promise<NotificationResult> {
    // This would be implemented when order functionality is added
    this.logger?.info('Order confirmation email requested', { email });
    
    return {
      success: false,
      error: 'Order confirmation functionality not yet implemented',
    };
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    recentActivity: Array<{
      type: string;
      recipient: string;
      status: 'sent' | 'failed';
      timestamp: string;
    }>;
  }> {
    // In a real implementation, this would query a database or analytics service
    return {
      totalSent: 0,
      totalFailed: 0,
      recentActivity: [],
    };
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<NotificationResult> {
    if (!this.mailerSendService) {
      return { success: false, error: 'MailerSend service not configured' };
    }

    try {
      // Send a test email to a test address (if configured)
      const testEmail = (this.env as any).TEST_EMAIL || 'test@godwear.ca';
      
      await this.sendEmail({
        to: testEmail,
        subject: 'GodWear Email Configuration Test',
        htmlContent: `
          <h1>Email Configuration Test</h1>
          <p>This is a test email to verify that the email configuration is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        textContent: `
          Email Configuration Test
          
          This is a test email to verify that the email configuration is working correctly.
          Timestamp: ${new Date().toISOString()}
        `,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check for notification service
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    const checks = {
      mailerSendApiKey: !!this.env.MAILERSEND_API_KEY,
      mailerSendService: !!this.mailerSendService,
    };

    const unhealthyChecks = Object.entries(checks)
      .filter(([, isHealthy]) => !isHealthy)
      .map(([check]) => check);

    if (unhealthyChecks.length > 0) {
      return {
        status: 'unhealthy',
        message: `Notification service configuration issues: ${unhealthyChecks.join(', ')}`,
        details: checks,
      };
    }

    // Test email configuration if possible
    try {
      const testResult = await this.testEmailConfiguration();
      
      if (!testResult.success) {
        return {
          status: 'degraded',
          message: 'Email configuration test failed',
          details: { error: testResult.error },
        };
      }
    } catch (error) {
      return {
        status: 'degraded',
        message: 'Email configuration test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }

    return {
      status: 'healthy',
      message: 'Notification service is operational',
      details: checks,
    };
  }
}
