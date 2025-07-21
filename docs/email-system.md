# GodWear Email System Documentation

This document provides comprehensive documentation for the GodWear email system, including architecture, components, configuration, and usage guidelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Email Services](#email-services)
3. [Email Templates](#email-templates)
4. [Email Implementations](#email-implementations)
5. [Email Analytics](#email-analytics)
6. [API Endpoints](#api-endpoints)
7. [Queue and Scheduling](#queue-and-scheduling)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Configuration](#configuration)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

## Architecture Overview

The GodWear email system is designed with a layered architecture to provide flexibility, reliability, and scalability:

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Endpoints                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Email Implementations                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Order    │  │  Shipping   │  │   Account   │  │Marketing│ │
│  │Confirmation │  │Notification │  │  Security   │  │ Emails  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       Email Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Queue    │  │Transactional│  │ MailerSend  │  │  Test   │ │
│  │   Service   │  │   Service   │  │   Service   │  │ Service │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Email Templates                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │Transactional│  │  Security   │  │  Marketing  │  │ Layouts │ │
│  │  Templates  │  │  Templates  │  │  Templates  │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Email Analytics                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Event     │  │   Metrics   │  │  Tracking   │  │Reporting│ │
│  │  Tracking   │  │ Calculation │  │   Pixels    │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **API Endpoints**: RESTful APIs for sending and managing emails
2. **Email Implementations**: Specialized classes for different email types
3. **Email Services**: Core services for sending, queueing, and managing emails
4. **Email Templates**: HTML and text templates for different email types
5. **Email Analytics**: Tracking and reporting for email performance

## Email Services

The email system provides several service implementations to handle different use cases:

### EmailQueueService

The `EmailQueueService` provides basic queueing, scheduling, and rate limiting capabilities:

- Queue emails for later processing
- Schedule emails for future delivery
- Apply rate limits based on priority
- Retry failed emails with exponential backoff

### EnhancedEmailQueueService

The `EnhancedEmailQueueService` extends the basic queue service with advanced features:

- Dynamic prioritization based on wait time and retry count
- Domain-based throttling to prevent overwhelming recipient domains
- Batch processing for improved performance
- Idempotency support to prevent duplicate emails
- Persistence for recovery after restarts

### TransactionalEmailService

The `TransactionalEmailService` provides specialized methods for sending transactional emails:

- Retry logic with exponential backoff
- Standardized error handling
- Template rendering with Handlebars
- Support for personalization and tracking

### MailerSendService

The `MailerSendService` provides direct integration with the MailerSend API:

- Send raw emails with HTML and text content
- Send templated emails using MailerSend templates
- Handle API errors and rate limits
- Support for attachments and personalization

### TestEmailService

The `TestEmailService` is designed for testing and development:

- Capture emails instead of sending them
- Simulate delivery events
- Validate email content and structure

## Email Templates

The email system uses Handlebars templates for rendering emails. Templates are organized by category:

### Transactional Templates

- `transactional/order-confirmation.html` / `.txt`: Order confirmation emails
- `transactional/shipping-notification.html` / `.txt`: Shipping notification emails
- `transactional/payment-confirmation.html` / `.txt`: Payment confirmation emails

### Security Templates

- `security/password-reset.html` / `.txt`: Password reset emails
- `security/email-verification.html` / `.txt`: Email verification emails
- `security/account-update.html` / `.txt`: Account update notification emails

### Marketing Templates

- `marketing/abandoned-cart.html` / `.txt`: Abandoned cart recovery emails
- `marketing/order-followup.html` / `.txt`: Order follow-up emails
- `marketing/product-review.html` / `.txt`: Product review request emails

### Template Features

- Responsive design for mobile and desktop
- Dark mode support
- Accessibility features
- Conditional sections based on data
- Personalization with user data
- Tracking pixels and links

## Email Implementations

The email system provides specialized implementation classes for different email types:

### OrderConfirmationEmail

Sends order confirmation emails with:

- Order details and summary
- Item breakdown with images and prices
- Shipping and billing information
- Payment details
- Tracking information (if available)

### ShippingNotificationEmail

Sends shipping notification emails with:

- Order details
- Shipping information
- Tracking number and link
- Estimated delivery date
- Item list with images

### AccountSecurityEmail

Sends account security emails with:

- Password reset links
- Email verification links
- Account update notifications
- Security alerts
- IP address and device information

### MarketingEmail

Sends marketing emails with:

- Abandoned cart recovery
- Order follow-up and feedback requests
- Product recommendations
- Personalized discounts
- Review requests

## Email Analytics

The email analytics system tracks and reports on email performance:

### Event Tracking

- Sent: When an email is sent
- Delivered: When an email is delivered to the recipient
- Opened: When a recipient opens an email
- Clicked: When a recipient clicks a link in an email
- Bounced: When an email cannot be delivered
- Complained: When a recipient marks an email as spam
- Unsubscribed: When a recipient unsubscribes from emails

### Metrics Calculation

- Delivery Rate: Percentage of emails that were delivered
- Open Rate: Percentage of delivered emails that were opened
- Click Rate: Percentage of delivered emails that were clicked
- Bounce Rate: Percentage of sent emails that bounced
- Complaint Rate: Percentage of delivered emails that were marked as spam
- Unsubscribe Rate: Percentage of delivered emails that resulted in unsubscribes
- Click-to-Open Rate: Percentage of opened emails that were clicked

### Tracking Mechanisms

- Tracking Pixels: 1x1 transparent GIFs for tracking opens
- Redirect Links: Proxy links for tracking clicks
- Webhooks: Integration with email service providers for event tracking

## API Endpoints

The email system provides RESTful API endpoints for sending and managing emails:

### Send Email

```
POST /api/emails/send
```

Send a raw or templated email:

```json
{
  "type": "raw",
  "to": "recipient@example.com",
  "subject": "Hello World",
  "html": "<p>Hello World</p>",
  "text": "Hello World"
}
```

or

```json
{
  "type": "templated",
  "to": "recipient@example.com",
  "subject": "Hello World",
  "templateName": "welcome",
  "templateData": {
    "name": "John Doe"
  }
}
```

### Send Batch Emails

```
POST /api/emails/batch
```

Send multiple emails in a single request:

```json
{
  "emails": [
    {
      "type": "raw",
      "to": "recipient1@example.com",
      "subject": "Hello World",
      "html": "<p>Hello World</p>",
      "text": "Hello World"
    },
    {
      "type": "templated",
      "to": "recipient2@example.com",
      "subject": "Hello World",
      "templateName": "welcome",
      "templateData": {
        "name": "Jane Doe"
      }
    }
  ]
}
```

### Resend Email

```
POST /api/emails/resend
```

Resend an email:

```json
{
  "emailId": "email-123",
  "updateRecipient": true,
  "newRecipient": {
    "email": "new-recipient@example.com"
  }
}
```

### Get Email Status

```
GET /api/emails/:emailId/status
```

Get the status of an email.

### Cancel Email

```
POST /api/emails/cancel
```

Cancel a scheduled email:

```json
{
  "emailId": "email-123"
}
```

## Queue and Scheduling

The email system provides queueing and scheduling capabilities:

### Priority Levels

- `critical`: Highest priority, no rate limits
- `high`: High priority, limited to 10 emails per second
- `medium`: Medium priority, limited to 5 emails per second
- `low`: Low priority, limited to 2 emails per second

### Scheduling

Emails can be scheduled for future delivery:

```javascript
await emailService.scheduleEmail(
  {
    to: "recipient@example.com",
    subject: "Scheduled Email",
    html: "<p>This email was scheduled</p>",
    text: "This email was scheduled"
  },
  new Date(Date.now() + 3600000) // 1 hour from now
);
```

### Rate Limiting

Rate limits are applied based on priority level:

- Global rate limits per priority level
- Domain-based throttling to prevent overwhelming recipient domains
- Token bucket algorithm for fair distribution of sending capacity

### Retry Logic

Failed emails are retried with exponential backoff:

- Default retry delays: 1s, 5s, 15s, 60s
- Configurable maximum retry attempts
- Detailed error logging for failed attempts

## Testing

The email system includes a comprehensive testing suite:

### Unit Tests

- Test email services and implementations
- Test template rendering
- Test analytics and tracking

### Integration Tests

- Test API endpoints
- Test email sending and delivery
- Test analytics integration

### Visual Testing

- Render templates with test data
- Save rendered templates for visual inspection
- Validate template structure and content

### Test Scripts

- `npm run test:emails`: Run all email tests
- `npm run test:emails:templates`: Test template rendering
- `npm run test:emails:visual`: Run visual tests
- `npm run test:emails:api`: Test API endpoints
- `npm run test:emails:analytics`: Test analytics
- `npm run test:emails:implementations`: Test email implementations

## Monitoring

The email system includes a monitoring dashboard for tracking email performance:

### Dashboard Features

- Real-time email delivery metrics
- Historical performance trends
- Bounce and complaint tracking
- Domain-specific delivery rates
- Template performance comparison

### Alerts

- High bounce rate alerts
- Delivery failures
- Queue size warnings
- Rate limit exceeded alerts

## Configuration

The email system can be configured using environment variables:

### Email Service Configuration

- `EMAIL_SERVICE_TYPE`: Type of email service to use (`queue`, `enhanced-queue`, `transactional`, `mailersend`, `test`)
- `EMAIL_PROVIDER`: Email service provider (`mailersend`, `sendgrid`)
- `EMAIL_API_KEY`: API key for the email service provider
- `EMAIL_FROM_ADDRESS`: Default from address
- `EMAIL_FROM_NAME`: Default from name
- `EMAIL_REPLY_TO`: Default reply-to address

### Queue Configuration

- `EMAIL_QUEUE_MAX_CONCURRENT`: Maximum number of concurrent email sending operations
- `EMAIL_QUEUE_RATE_CRITICAL`: Rate limit for critical emails (per second)
- `EMAIL_QUEUE_RATE_HIGH`: Rate limit for high priority emails (per second)
- `EMAIL_QUEUE_RATE_MEDIUM`: Rate limit for medium priority emails (per second)
- `EMAIL_QUEUE_RATE_LOW`: Rate limit for low priority emails (per second)
- `EMAIL_QUEUE_RETRY_DELAYS`: JSON array of retry delays in milliseconds
- `EMAIL_QUEUE_PERSISTENCE_KEY`: Key for queue persistence
- `EMAIL_QUEUE_MAX_SIZE`: Maximum queue size
- `EMAIL_QUEUE_BATCH_SIZE`: Batch size for processing
- `EMAIL_QUEUE_PROCESSING_INTERVAL`: Processing interval in milliseconds
- `EMAIL_QUEUE_CLEANUP_INTERVAL`: Cleanup interval in milliseconds
- `EMAIL_QUEUE_MAX_AGE`: Maximum age of completed/failed items in milliseconds
- `EMAIL_DOMAIN_THROTTLES`: JSON object of domain throttles

### Analytics Configuration

- `EMAIL_ANALYTICS_SERVICE_TYPE`: Type of analytics service to use (`memory`, `database`)
- `EMAIL_ANALYTICS_RETENTION_DAYS`: Number of days to retain analytics data

## Best Practices

### Email Content

- Keep emails concise and focused
- Use clear and descriptive subject lines
- Include both HTML and plain text versions
- Use responsive design for mobile compatibility
- Include unsubscribe links in marketing emails
- Follow accessibility guidelines

### Email Sending

- Use appropriate priority levels
- Implement idempotency for critical emails
- Schedule non-urgent emails during off-peak hours
- Monitor bounce and complaint rates
- Respect recipient preferences

### Email Templates

- Use consistent branding and styling
- Test templates across different email clients
- Use conditional sections for personalization
- Include tracking pixels and links for analytics
- Follow email design best practices

## Troubleshooting

### Common Issues

#### Emails Not Sending

- Check API key and credentials
- Verify rate limits and quotas
- Check for validation errors in email data
- Verify that the queue is processing

#### High Bounce Rates

- Verify recipient email addresses
- Check for domain reputation issues
- Review email content for spam triggers
- Monitor IP reputation

#### Template Rendering Issues

- Check template syntax and variables
- Verify that template data is complete
- Test templates with different data sets
- Check for HTML compatibility issues

#### Analytics Discrepancies

- Verify tracking pixel and link implementation
- Check for email client blocking of tracking pixels
- Verify webhook configuration
- Check for data processing delays
