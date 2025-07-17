/**
 * Enhanced MailerSend service with contact management and marketing integration
 */
export class MailerSendService {
    apiKey;
    fromEmail;
    fromName;
    baseUrl = "https://api.mailersend.com/v1";
    constructor(apiKey, fromEmail = "noreply@godwear.ca", fromName = "GodWear") {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }
    /**
     * Send welcome email to new user and add them to marketing contacts
     */
    async sendWelcomeEmail(to, userName, addToContacts = true) {
        try {
            // Add user to contacts first if requested
            if (addToContacts) {
                await this.addContact({
                    email: to,
                    name: userName,
                    customFields: {
                        signup_date: new Date().toISOString(),
                        user_type: "authenticated",
                        welcome_email_sent: true,
                    },
                });
            }
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
            .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to GodWear! 🙏</h1>
              <p>Where Faith Meets Fashion</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for joining GodWear, where faith meets fashion. We're excited to have you as part of our community of believers who want to express their faith through style!</p>
              
              <div class="highlight">
                <strong>🎉 Welcome Bonus:</strong> Use code <strong>WELCOME10</strong> for 10% off your first order!
              </div>
              
              <p>With your GodWear account, you can:</p>
              <ul>
                <li>🛍️ Browse our collection of faith-inspired apparel</li>
                <li>❤️ Save your favorite items to your wishlist</li>
                <li>📦 Track your orders and delivery status</li>
                <li>✨ Get exclusive access to new collections</li>
                <li>📧 Receive inspiration and style tips</li>
                <li>🤝 Connect with our community of believers</li>
              </ul>
              
              <p>Ready to explore? Start shopping now:</p>
              <a href="https://godwear.ca/shop?utm_source=welcome_email&utm_medium=email&utm_campaign=new_user" class="button">Start Shopping</a>
              
              <p><strong>Follow Your Faith Journey:</strong></p>
              <p>We'll send you occasional updates about new collections, faith-based content, and exclusive offers. You can update your preferences or unsubscribe at any time.</p>
              
              <p>If you have any questions, our support team is here to help at <a href="mailto:support@godwear.ca">support@godwear.ca</a></p>
              
              <p>Blessings and welcome to the family,<br><strong>The GodWear Team</strong></p>
            </div>
            <div class="footer">
              <p><strong>GodWear</strong> - Faith Meets Fashion</p>
              <p>Visit us at <a href="https://godwear.ca">godwear.ca</a> | Follow us on social media</p>
              <p><a href="https://godwear.ca/unsubscribe?email=${encodeURIComponent(to)}">Unsubscribe</a> | <a href="https://godwear.ca/privacy">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
            const textContent = `
Welcome to GodWear! 🙏
Where Faith Meets Fashion

Hello ${userName}!

Thank you for joining GodWear, where faith meets fashion. We're excited to have you as part of our community of believers who want to express their faith through style!

🎉 WELCOME BONUS: Use code WELCOME10 for 10% off your first order!

With your GodWear account, you can:
- Browse our collection of faith-inspired apparel
- Save your favorite items to your wishlist
- Track your orders and delivery status
- Get exclusive access to new collections
- Receive inspiration and style tips
- Connect with our community of believers

Ready to explore? Visit: https://godwear.ca/shop

Follow Your Faith Journey:
We'll send you occasional updates about new collections, faith-based content, and exclusive offers. You can update your preferences or unsubscribe at any time.

If you have any questions, our support team is here to help at support@godwear.ca

Blessings and welcome to the family,
The GodWear Team

---
GodWear - Faith Meets Fashion
Visit us at https://godwear.ca
Unsubscribe: https://godwear.ca/unsubscribe?email=${encodeURIComponent(to)}
      `;
            const result = await this.sendEmail(to, "Welcome to GodWear - Your Faith Journey Begins! 🙏", htmlContent, textContent, userName);
            return { success: true, messageId: result.messageId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Send email with enhanced delivery tracking
     */
    async sendEmail(to, subject, htmlContent, textContent, recipientName) {
        try {
            const payload = {
                from: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                to: [
                    {
                        email: to,
                        name: recipientName || to,
                    },
                ],
                subject: subject,
                html: htmlContent,
                text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
                reply_to: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                // Add tracking and analytics
                settings: {
                    track_clicks: true,
                    track_opens: true,
                    track_content: true,
                },
                // Add tags for better organization
                tags: ["godwear", "automated"],
            };
            const response = await fetch(`${this.baseUrl}/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            return {
                success: true,
                messageId: result.message_id || result.id,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Add contact to MailerSend for marketing purposes
     */
    async addContact(contactData) {
        try {
            const payload = {
                email: contactData.email,
                name: contactData.name,
                custom_fields: contactData.customFields || {},
            };
            const response = await fetch(`${this.baseUrl}/recipients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend Contact API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            return {
                success: true,
                contactId: result.data?.id,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Find contact by email address
     */
    async findContactByEmail(email) {
        try {
            const response = await fetch(`${this.baseUrl}/recipients?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend Find Contact API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            const contact = result.data?.find((c) => c.email === email);
            if (contact) {
                return {
                    success: true,
                    contactId: contact.id,
                    contact,
                };
            }
            return { success: false, error: "Contact not found" };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Send marketing email to multiple recipients
     */
    async sendMarketingEmail(recipients, subject, htmlContent, textContent) {
        try {
            const payload = {
                from: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                to: recipients.map((recipient) => ({
                    email: recipient.email,
                    name: recipient.name || recipient.email,
                })),
                subject: subject,
                html: htmlContent,
                text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
                settings: {
                    track_clicks: true,
                    track_opens: true,
                    track_content: true,
                },
                tags: ["godwear", "marketing", "bulk"],
            };
            const response = await fetch(`${this.baseUrl}/bulk-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend Bulk Email API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            return {
                success: true,
                messageId: result.bulk_email_id || result.id,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Get email delivery statistics
     */
    async getEmailStats(messageId) {
        try {
            const response = await fetch(`${this.baseUrl}/activity/${messageId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend Stats API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            return {
                success: true,
                stats: {
                    delivered: result.delivered || 0,
                    opened: result.opened || 0,
                    clicked: result.clicked || 0,
                    bounced: result.bounced || 0,
                    complained: result.complained || 0,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Test MailerSend API connection and configuration
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/domains`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MailerSend API test failed: ${response.status} - ${errorText}`);
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}
//# sourceMappingURL=mailersend.js.map