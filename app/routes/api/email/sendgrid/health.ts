import { createRoute } from 'honox/factory'

// SendGrid health check endpoint
export default createRoute(async (c) => {
  return c.json({
    status: 'ok',
    service: 'sendgrid-email',
    timestamp: new Date().toISOString(),
    hasSendGridKey: !!c.env.SENDGRID_API_KEY,
    environment: c.env.NODE_ENV || 'development'
  })
})
