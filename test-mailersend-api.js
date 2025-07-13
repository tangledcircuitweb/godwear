import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;

if (!MAILERSEND_API_KEY) {
  process.exit(1);
}

// Test email configuration - using administrator email for trial account
const testEmail = {
  to: "njordrenterprises@gmail.com", // This should be your MailerSend account admin email
  name: "Test User",
  subject: "GodWear MailerSend Direct API Test 🙏",
};

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MailerSend Direct API Test</title>
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
            <h1>MailerSend Direct API Test 🚀</h1>
        </div>
        <div class="content">
            <h2>Hello ${testEmail.name}!</h2>
            <p class="success">✅ MailerSend Direct HTTP API integration is working perfectly!</p>
            
            <p>This test email confirms that:</p>
            <ul>
                <li>✅ MailerSend API key is configured correctly</li>
                <li>✅ Direct HTTP API calls are working</li>
                <li>✅ No SDK dependencies needed</li>
                <li>✅ HTML templates are rendering properly</li>
                <li>✅ Ready for production use with GodWear</li>
            </ul>
            
            <p>Your GodWear application can now send welcome emails, notifications, and other transactional emails reliably using direct API calls.</p>
            
            <p>Blessings,<br>The GodWear Development Team</p>
        </div>
        <div class="footer">
            <p>GodWear - Faith Meets Fashion</p>
            <p>This is a test email from your MailerSend Direct API integration</p>
        </div>
    </div>
</body>
</html>
`;

const textContent = `
MailerSend Direct API Test 🚀

Hello ${testEmail.name}!

✅ MailerSend Direct HTTP API integration is working perfectly!

This test email confirms that:
✅ MailerSend API key is configured correctly
✅ Direct HTTP API calls are working
✅ No SDK dependencies needed
✅ HTML templates are rendering properly
✅ Ready for production use with GodWear

Your GodWear application can now send welcome emails, notifications, and other transactional emails reliably using direct API calls.

Blessings,
The GodWear Development Team

---
GodWear - Faith Meets Fashion
This is a test email from your MailerSend Direct API integration
`;

async function sendTestEmail() {
  const payload = {
    from: {
      email: "noreply@godwear.ca",
      name: "GodWear Test",
    },
    to: [
      {
        email: testEmail.to,
        name: testEmail.name,
      },
    ],
    subject: testEmail.subject,
    html: htmlContent,
    text: textContent,
    reply_to: {
      email: "noreply@godwear.ca",
      name: "GodWear Test",
    },
  };

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MailerSend API error: ${response.status} - ${errorText}`);
    }

    const _responseData = await response.text();
  } catch (_error) {
    process.exit(1);
  }
}

// Run the test
void sendTestEmail();
