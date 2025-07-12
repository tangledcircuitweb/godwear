// Alternative SendGrid test with generic sender
const sgMail = require('@sendgrid/mail')

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is required')
  process.exit(1)
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: 'njordrenterprises@gmail.com',
  from: 'noreply@example.com', // Generic sender - might work without verification
  subject: 'GodWear SendGrid Test',
  text: 'Testing SendGrid integration for GodWear',
  html: '<h1>SendGrid Test</h1><p>If you receive this, SendGrid is working!</p>',
}

console.log('🧪 Testing SendGrid with generic sender...')

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!')
    console.log('📬 Check njordrenterprises@gmail.com')
  })
  .catch((error) => {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Details:', error.response.body)
    }
  })
