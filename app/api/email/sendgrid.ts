import { Hono } from 'hono';
import { CloudflareBindings } from '../../../worker-configuration';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// SendGrid API configuration
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendGridMessage {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
    subject: string;
  }>;
  from: {
    email: string;
    name?: string;
  };
  content: Array<{
    type: string;
    value: string;
  }>;
}

// Send email using SendGrid API
async function sendEmail(emailData: EmailData, apiKey: string): Promise<boolean> {
  try {
    const message: SendGridMessage = {
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject,
        },
      ],
      from: {
        email: emailData.from,
        name: 'GodWear',
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html,
        },
      ],
    };

    // Add plain text version if provided
    if (emailData.text) {
      message.content.unshift({
        type: 'text/plain',
        value: emailData.text,
      });
    }

    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', response.status, errorText);
      return false;
    }

    console.log('Email sent successfully to:', emailData.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Welcome email template
function generateWelcomeEmail(userName: string, userEmail: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          <p>Your spiritual fashion journey begins here</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Thank you for joining the GodWear community. We're excited to have you on this journey of faith and fashion.</p>
          
          <p>With your account, you can:</p>
          <ul>
            <li>Browse our exclusive collection of faith-inspired apparel</li>
            <li>Get early access to new releases</li>
            <li>Receive personalized recommendations</li>
            <li>Join our community of believers</li>
          </ul>
          
          <a href="https://godwear.ca/shop" class="button">Start Shopping</a>
          
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@godwear.ca">support@godwear.ca</a></p>
          
          <p>Blessings,<br>The GodWear Team</p>
        </div>
        <div class="footer">
          <p>© 2025 GodWear. All rights reserved.</p>
          <p>You received this email because you created an account at godwear.ca</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to GodWear! 🙏
    
    Hello ${userName}!
    
    Thank you for joining the GodWear community. We're excited to have you on this journey of faith and fashion.
    
    With your account, you can:
    - Browse our exclusive collection of faith-inspired apparel
    - Get early access to new releases
    - Receive personalized recommendations
    - Join our community of believers
    
    Start shopping: https://godwear.ca/shop
    
    If you have any questions, reach out to us at support@godwear.ca
    
    Blessings,
    The GodWear Team
    
    © 2025 GodWear. All rights reserved.
    You received this email because you created an account at godwear.ca
  `;

  return { html, text };
}

// Send welcome email endpoint
app.post('/welcome', async (c) => {
  try {
    // Check for SendGrid API key
    if (!c.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY environment variable is not set');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    // Get user data from request
    const { email, name } = await c.req.json();
    
    if (!email || !name) {
      return c.json({ error: 'Email and name are required' }, 400);
    }

    // Generate welcome email content
    const emailContent = generateWelcomeEmail(name, email);
    
    // Send email
    const success = await sendEmail({
      to: email,
      from: 'welcome@godwear.ca', // Make sure this is verified in SendGrid
      subject: 'Welcome to GodWear - Your Faith Fashion Journey Begins! 🙏',
      html: emailContent.html,
      text: emailContent.text,
    }, c.env.SENDGRID_API_KEY);

    if (success) {
      return c.json({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      });
    } else {
      return c.json({ 
        error: 'Failed to send welcome email' 
      }, 500);
    }

  } catch (error) {
    console.error('Welcome email error:', error);
    return c.json({
      error: 'Failed to send welcome email',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Test email endpoint
app.post('/test', async (c) => {
  try {
    // Check for SendGrid API key
    if (!c.env.SENDGRID_API_KEY) {
      return c.json({ error: 'SENDGRID_API_KEY not configured' }, 500);
    }

    // Send test email
    const success = await sendEmail({
      to: 'test@example.com', // Replace with your email for testing
      from: 'test@godwear.ca',
      subject: 'GodWear SendGrid Test Email',
      html: '<h1>Test Email</h1><p>If you receive this, SendGrid is working correctly!</p>',
      text: 'Test Email - If you receive this, SendGrid is working correctly!',
    }, c.env.SENDGRID_API_KEY);

    return c.json({ 
      success, 
      message: success ? 'Test email sent' : 'Failed to send test email' 
    });

  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ error: 'Test email failed' }, 500);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'sendgrid-email',
    timestamp: new Date().toISOString(),
    hasSendGridKey: !!c.env.SENDGRID_API_KEY
  });
});

export default app;
