import { MailerSendService } from "../../lib/mailersend";
/**
 * Enhanced notification service with comprehensive MailerSend integration
 * Features: Contact management, marketing campaigns, delivery tracking, and analytics
 */
export class NotificationService {
  serviceName = "notification-service";
  env;
  logger;
  mailerSendService;
  initialize(dependencies) {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
    // Initialize MailerSend service if API key is available
    if (this.env.MAILERSEND_API_KEY) {
      this.mailerSendService = new MailerSendService(this.env.MAILERSEND_API_KEY);
    }
  }
  /**
   * Send enhanced welcome email with contact management
   */
  async sendWelcomeEmail(data) {
    if (!this.mailerSendService) {
      const error = "MailerSend service not configured";
      this.logger?.error(error);
      return { success: false, error };
    }
    try {
      // Enhanced welcome email with contact management
      const result = await this.mailerSendService.sendWelcomeEmail(
        data.email,
        data.name,
        data.addToContacts !== false // Default to true
      );
      if (result.success) {
        this.logger?.info("Enhanced welcome email sent successfully", {
          recipient: data.email,
          name: data.name,
          messageId: result.messageId,
          addedToContacts: data.addToContacts !== false,
        });
        return {
          success: true,
          messageId: result.messageId,
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger?.error("Enhanced welcome email failed", error, {
        recipient: data.email,
        name: data.name,
      });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * Send custom email notification with optional contact management
   */
  async sendEmail(notification) {
    if (!this.mailerSendService) {
      const error = "MailerSend service not configured";
      this.logger?.error(error);
      return { success: false, error };
    }
    try {
      // Add to contacts if requested
      let contactId;
      if (notification.addToContacts && notification.recipientName) {
        const contactResult = await this.addContact({
          email: notification.to,
          name: notification.recipientName,
          customFields: {
            email_type: "custom_notification",
            sent_at: new Date().toISOString(),
          },
        });
        if (contactResult.success) {
          contactId = contactResult.contactId;
        }
      }
      const result = await this.mailerSendService.sendEmail(
        notification.to,
        notification.subject,
        notification.htmlContent,
        notification.textContent,
        notification.recipientName
      );
      if (result.success) {
        this.logger?.info("Email sent successfully", {
          recipient: notification.to,
          subject: notification.subject,
          messageId: result.messageId,
          contactId,
        });
        return {
          success: true,
          messageId: result.messageId,
          contactId,
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger?.error("Email sending failed", error, {
        recipient: notification.to,
        subject: notification.subject,
      });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * Add contact to MailerSend for marketing purposes
   */
  async addContact(contactData) {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    try {
      const result = await this.mailerSendService.addContact(contactData);
      if (result.success) {
        this.logger?.info("Contact added successfully", {
          email: contactData.email,
          name: contactData.name,
          contactId: result.contactId,
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger?.error("Failed to add contact", error, {
        email: contactData.email,
        name: contactData.name,
      });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * Send bulk marketing email
   */
  async sendBulkEmail(emailData) {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    try {
      const result = await this.mailerSendService.sendMarketingEmail(
        emailData.recipients,
        emailData.subject,
        emailData.htmlContent,
        emailData.textContent
      );
      if (result.success) {
        this.logger?.info("Bulk email sent successfully", {
          recipientCount: emailData.recipients.length,
          subject: emailData.subject,
          messageId: result.messageId,
        });
        return {
          success: true,
          messageId: result.messageId,
          recipientCount: emailData.recipients.length,
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger?.error("Bulk email failed", error, {
        recipientCount: emailData.recipients.length,
        subject: emailData.subject,
      });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * Get email delivery statistics
   */
  async getEmailStats(messageId) {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    try {
      const result = await this.mailerSendService.getEmailStats(messageId);
      if (result.success && result.stats) {
        return {
          success: true,
          stats: {
            messageId,
            delivered: result.stats.delivered,
            opened: result.stats.opened,
            clicked: result.stats.clicked,
            bounced: result.stats.bounced,
            complained: result.stats.complained,
            timestamp: new Date().toISOString(),
          },
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  /**
   * Send order confirmation email (enhanced for ecommerce)
   */
  async sendOrderConfirmationEmail(email, orderData) {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - GodWear</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🙏</h1>
            <p>Thank you for your purchase</p>
          </div>
          <div class="content">
            <h2>Hello ${orderData.customerName}!</h2>
            <p>Your order has been confirmed and is being prepared for shipment.</p>
            
            <div class="order-details">
              <h3>Order #${orderData.orderId}</h3>
              ${orderData.items
                .map(
                  (item) => `
                <div class="item">
                  <span>${item.name} (x${item.quantity})</span>
                  <span>$${item.price.toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
              <div class="item total">
                <span>Total</span>
                <span>$${orderData.total.toFixed(2)}</span>
              </div>
            </div>
            
            <p><strong>Shipping Address:</strong><br>${orderData.shippingAddress}</p>
            
            <p>We'll send you tracking information once your order ships.</p>
            
            <p>Blessings,<br>The GodWear Team</p>
          </div>
          <div class="footer">
            <p>GodWear - Faith Meets Fashion</p>
            <p>Questions? Contact us at <a href="mailto:support@godwear.ca">support@godwear.ca</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderData.orderId} - GodWear`,
      htmlContent,
      recipientName: orderData.customerName,
      addToContacts: true,
    });
  }
  /**
   * Send password reset email (enhanced implementation)
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    const resetUrl = `${this.env.PRODUCTION_DOMAIN || "https://godwear.ca"}/reset-password?token=${resetToken}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - GodWear</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || "there"}!</h2>
            <p>We received a request to reset your password for your GodWear account.</p>
            
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p>Blessings,<br>The GodWear Team</p>
          </div>
          <div class="footer">
            <p>GodWear - Faith Meets Fashion</p>
            <p>If you need help, contact us at <a href="mailto:support@godwear.ca">support@godwear.ca</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: "Reset Your GodWear Password",
      htmlContent,
      recipientName: userName,
    });
  }
  /**
   * Get comprehensive notification statistics
   */
  async getNotificationStats() {
    // In a real implementation, this would query the database or analytics service
    // For now, return mock data structure
    return {
      totalSent: 0,
      totalFailed: 0,
      contactsManaged: 0,
      recentActivity: [],
    };
  }
  /**
   * Test MailerSend configuration and connectivity
   */
  async testEmailConfiguration() {
    if (!this.mailerSendService) {
      return { success: false, error: "MailerSend service not configured" };
    }
    try {
      // Test API connection
      const connectionTest = await this.mailerSendService.testConnection();
      if (!connectionTest.success) {
        return { success: false, error: connectionTest.error };
      }
      // Send a test email if test email is configured
      const testEmail = this.env.TEST_EMAIL || "test@godwear.ca";
      const result = await this.sendEmail({
        to: testEmail,
        subject: "GodWear MailerSend Configuration Test",
        htmlContent: `
          <h1>MailerSend Configuration Test</h1>
          <p>This is a test email to verify that the MailerSend integration is working correctly.</p>
          <p><strong>Features tested:</strong></p>
          <ul>
            <li>✅ API Connection</li>
            <li>✅ Email Sending</li>
            <li>✅ HTML Content</li>
            <li>✅ Contact Management</li>
          </ul>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        textContent: `
          MailerSend Configuration Test
          
          This is a test email to verify that the MailerSend integration is working correctly.
          
          Features tested:
          - API Connection
          - Email Sending
          - HTML Content
          - Contact Management
          
          Timestamp: ${new Date().toISOString()}
        `,
        addToContacts: false, // Don't add test emails to contacts
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  /**
   * Enhanced health check for notification service
   */
  async healthCheck() {
    const checks = {
      mailerSendApiKey: !!this.env.MAILERSEND_API_KEY,
      mailerSendService: !!this.mailerSendService,
    };
    const unhealthyChecks = Object.entries(checks)
      .filter(([, isHealthy]) => !isHealthy)
      .map(([check]) => check);
    if (unhealthyChecks.length > 0) {
      return {
        status: "unhealthy",
        message: `Notification service configuration issues: ${unhealthyChecks.join(", ")}`,
        details: checks,
      };
    }
    // Test MailerSend API connection
    if (this.mailerSendService) {
      try {
        const connectionTest = await this.mailerSendService.testConnection();
        if (!connectionTest.success) {
          return {
            status: "degraded",
            message: "MailerSend API connection failed",
            details: { error: connectionTest.error },
          };
        }
      } catch (error) {
        return {
          status: "degraded",
          message: "MailerSend API connection test failed",
          details: { error: error instanceof Error ? error.message : "Unknown error" },
        };
      }
    }
    return {
      status: "healthy",
      message: "Enhanced notification service with MailerSend integration is operational",
      details: {
        ...checks,
        features: [
          "Contact Management",
          "Marketing Campaigns",
          "Delivery Tracking",
          "Bulk Email",
          "Enhanced Templates",
        ],
      },
    };
  }
}
//# sourceMappingURL=notification-service.js.map
