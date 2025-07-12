// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require('@sendgrid/mail')

// Check if API key is provided
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is required')
  console.log('💡 Usage: SENDGRID_API_KEY="your-api-key" node sendgrid-test.cjs')
  process.exit(1)
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// sgMail.setDataResidency('eu'); 
// uncomment the above line if you are sending mail using a regional EU subuser

const msg = {
  to: 'njordrenterprises@gmail.com', // Your email for testing
  from: 'test@godwear.ca', // Change to your verified sender (you'll need to verify this domain in SendGrid)
  subject: 'GodWear SendGrid Test - Success! 🎉',
  text: 'Congratulations! Your SendGrid integration is working correctly with GodWear.',
  html: `
    <h1>🎉 GodWear SendGrid Test Successful!</h1>
    <p>Your SendGrid integration is working correctly.</p>
    <p><strong>Next steps:</strong></p>
    <ul>
      <li>✅ SendGrid API connection verified</li>
      <li>✅ Email sending functionality working</li>
      <li>🚀 Ready for OAuth welcome emails</li>
    </ul>
    <p>Blessings,<br>The GodWear Team</p>
  `,
}

console.log('🧪 Testing SendGrid with official test code...')
console.log('📧 Sending test email to: njordrenterprises@gmail.com')
console.log('📤 From: test@godwear.ca')

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!')
    console.log('📬 Check your inbox at njordrenterprises@gmail.com')
    console.log('🚀 SendGrid integration is ready for production!')
  })
  .catch((error) => {
    console.error('❌ SendGrid Error:', error.message)
    if (error.response) {
      console.error('📋 Response details:', error.response.body)
    }
    
    // Common error explanations
    if (error.message.includes('Forbidden')) {
      console.log('💡 This might be because:')
      console.log('   - The sender email (test@godwear.ca) is not verified in SendGrid')
      console.log('   - Try using a verified sender email from your SendGrid account')
    }
  })
