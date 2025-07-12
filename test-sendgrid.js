// Simple SendGrid test script
// Run with: node test-sendgrid.js

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key-here';
const TEST_EMAIL = 'your-email@example.com'; // Replace with your email

async function testSendGrid() {
  console.log('🧪 Testing SendGrid integration...');
  
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'your-sendgrid-api-key-here') {
    console.error('❌ Please set SENDGRID_API_KEY environment variable');
    console.log('💡 Run: export SENDGRID_API_KEY="your-actual-api-key"');
    return;
  }

  const message = {
    personalizations: [
      {
        to: [{ email: TEST_EMAIL }],
        subject: 'GodWear SendGrid Test - Success! 🎉',
      },
    ],
    from: {
      email: 'test@godwear.ca', // Make sure this domain is verified in SendGrid
      name: 'GodWear Test',
    },
    content: [
      {
        type: 'text/plain',
        value: 'Congratulations! Your SendGrid integration is working correctly. 🚀',
      },
      {
        type: 'text/html',
        value: `
          <h1>🎉 SendGrid Test Successful!</h1>
          <p>Your GodWear SendGrid integration is working correctly.</p>
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>✅ SendGrid API connection verified</li>
            <li>✅ Email sending functionality working</li>
            <li>🚀 Ready for OAuth welcome emails</li>
          </ul>
          <p>Blessings,<br>The GodWear Team</p>
        `,
      },
    ],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Check your inbox at: ${TEST_EMAIL}`);
      console.log('🚀 SendGrid integration is ready for production!');
    } else {
      const errorText = await response.text();
      console.error('❌ SendGrid API error:', response.status);
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run the test
testSendGrid();
