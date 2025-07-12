import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export class MailerSendService {
  private mailerSend: MailerSend;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string = 'noreply@godwear.ca', fromName: string = 'GodWear') {
    this.mailerSend = new MailerSend({
      apiKey: apiKey,
    });
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const sentFrom = new Sender(this.fromEmail, this.fromName);
    const recipients = [new Recipient(to, userName)];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to GodWear</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to GodWear! 🙏</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for joining GodWear, where faith meets fashion. We're excited to have you as part of our community!</p>
            
            <p>With your account, you can:</p>
            <ul>
              <li>Browse our collection of faith-inspired apparel</li>
              <li>Save your favorite items to your wishlist</li>
              <li>Track your orders and delivery status</li>
              <li>Get exclusive access to new collections</li>
            </ul>
            
            <p>Ready to explore? Start shopping now:</p>
            <a href="https://godwear.ca/shop" class="button">Start Shopping</a>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Blessings,<br>The GodWear Team</p>
          </div>
          <div class="footer">
            <p>GodWear - Faith Meets Fashion</p>
            <p>Visit us at <a href="https://godwear.ca">godwear.ca</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to GodWear! 🙏

Hello ${userName}!

Thank you for joining GodWear, where faith meets fashion. We're excited to have you as part of our community!

With your account, you can:
- Browse our collection of faith-inspired apparel
- Save your favorite items to your wishlist
- Track your orders and delivery status
- Get exclusive access to new collections

Ready to explore? Visit: https://godwear.ca/shop

If you have any questions, feel free to reach out to our support team.

Blessings,
The GodWear Team

---
GodWear - Faith Meets Fashion
Visit us at https://godwear.ca
    `;

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('Welcome to GodWear - Your Faith Journey Begins! 🙏')
      .setHtml(htmlContent)
      .setText(textContent);

    try {
      const response = await this.mailerSend.email.send(emailParams);
      console.log('Welcome email sent successfully via MailerSend:', response);
    } catch (error) {
      console.error('Failed to send welcome email via MailerSend:', error);
      throw error;
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string,
    recipientName?: string
  ): Promise<void> {
    const sentFrom = new Sender(this.fromEmail, this.fromName);
    const recipients = [new Recipient(to, recipientName || to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setHtml(htmlContent);

    if (textContent) {
      emailParams.setText(textContent);
    }

    try {
      const response = await this.mailerSend.email.send(emailParams);
      console.log('Email sent successfully via MailerSend:', response);
    } catch (error) {
      console.error('Failed to send email via MailerSend:', error);
      throw error;
    }
  }
}
