// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// sgMail.setDataResidency('eu'); 
// uncomment the above line if you are sending mail using a regional EU subuser

const msg = {
  to: 'njordrenterprises@gmail.com', // Your email for testing
  from: 'test@godwear.ca', // Change to your verified sender (you'll need to verify this domain in SendGrid)
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}

console.log('🧪 Testing SendGrid with official test code...')
console.log('📧 Sending test email to: njordrenterprises@gmail.com')

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!')
    console.log('📬 Check your inbox at njordrenterprises@gmail.com')
  })
  .catch((error) => {
    console.error('❌ SendGrid Error:', error)
    if (error.response) {
      console.error('Response body:', error.response.body)
    }
  })
