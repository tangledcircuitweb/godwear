import { createRoute } from 'honox/factory'

// SendGrid test endpoint
export default createRoute(async (c) => {
  try {
    // Check for SendGrid API key
    if (!c.env.SENDGRID_API_KEY) {
      return c.json({ error: 'SENDGRID_API_KEY not configured' }, 500)
    }

    // Send test email using SendGrid API
    const message = {
      personalizations: [
        {
          to: [{ email: 'njordrenterprises@gmail.com' }],
          subject: 'GodWear SendGrid Test - Success! 🎉',
        },
      ],
      from: {
        email: 'test@godwear.ca',
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
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (response.ok) {
      console.log('✅ Test email sent successfully to njordrenterprises@gmail.com')
      return c.json({ 
        success: true, 
        message: 'Test email sent successfully to njordrenterprises@gmail.com',
        timestamp: new Date().toISOString()
      })
    } else {
      const errorText = await response.text()
      console.error('SendGrid API error:', response.status, errorText)
      return c.json({ 
        success: false,
        error: 'Failed to send test email',
        details: errorText
      }, 500)
    }

  } catch (error) {
    console.error('SendGrid test error:', error)
    return c.json({
      success: false,
      error: 'SendGrid test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})
