import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;

if (!MAILERSEND_API_KEY) {
    console.error('❌ MAILERSEND_API_KEY not found in environment variables');
    process.exit(1);
}

console.log('🚀 Testing MailerSend integration...');
console.log('📧 API Key found:', MAILERSEND_API_KEY.substring(0, 10) + '...');

const mailerSend = new MailerSend({
    apiKey: MAILERSEND_API_KEY,
});

// Test email configuration
const testEmail = {
    to: 'njordrenterprises@gmail.com', // Your email address
    name: 'Test User',
    subject: 'GodWear MailerSend Test Email 🙏'
};

const sentFrom = new Sender('noreply@godwear.ca', 'GodWear Test');
const recipients = [new Recipient(testEmail.to, testEmail.name)];

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MailerSend Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { color: #28a745; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MailerSend Test Email 🚀</h1>
        </div>
        <div class="content">
            <h2>Hello ${testEmail.name}!</h2>
            <p class="success">✅ MailerSend integration is working perfectly!</p>
            
            <p>This test email confirms that:</p>
            <ul>
                <li>✅ MailerSend API key is configured correctly</li>
                <li>✅ Email service is operational</li>
                <li>✅ HTML templates are rendering properly</li>
                <li>✅ Ready for production use with GodWear</li>
            </ul>
            
            <p>Your GodWear application can now send welcome emails, notifications, and other transactional emails reliably.</p>
            
            <p>Blessings,<br>The GodWear Development Team</p>
        </div>
        <div class="footer">
            <p>GodWear - Faith Meets Fashion</p>
            <p>This is a test email from your MailerSend integration</p>
        </div>
    </div>
</body>
</html>
`;

const textContent = `
MailerSend Test Email 🚀

Hello ${testEmail.name}!

✅ MailerSend integration is working perfectly!

This test email confirms that:
✅ MailerSend API key is configured correctly
✅ Email service is operational  
✅ HTML templates are rendering properly
✅ Ready for production use with GodWear

Your GodWear application can now send welcome emails, notifications, and other transactional emails reliably.

Blessings,
The GodWear Development Team

---
GodWear - Faith Meets Fashion
This is a test email from your MailerSend integration
`;

const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(testEmail.subject)
    .setHtml(htmlContent)
    .setText(textContent);

async function sendTestEmail() {
    try {
        console.log('📤 Sending test email to:', testEmail.to);
        
        const response = await mailerSend.email.send(emailParams);
        
        console.log('✅ Test email sent successfully!');
        console.log('📊 Response:', response);
        console.log('🎉 MailerSend integration is working perfectly!');
        
    } catch (error) {
        console.error('❌ Failed to send test email:', error);
        
        if (error.body) {
            console.error('📋 Error details:', error.body);
        }
        
        process.exit(1);
    }
}

// Run the test
sendTestEmail();
