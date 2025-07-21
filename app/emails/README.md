# GodWear Email System

This directory contains the email templates and services for the GodWear platform's transactional email system.

## Directory Structure

```
app/emails/
├── README.md                 # This documentation file
├── services/                 # Email service implementations
│   ├── email-service.ts      # Core email service interface
│   ├── mailersend-service.ts # MailerSend implementation
│   └── test-service.ts       # Test email service for development
├── templates/                # Email templates organized by category
│   ├── base.html             # Base HTML template with common structure
│   ├── base.txt              # Base plain text template
│   ├── account/              # Account-related email templates
│   │   ├── welcome.html      # Welcome email (HTML)
│   │   ├── welcome.txt       # Welcome email (plain text)
│   │   ├── password-reset.html # Password reset email (HTML)
│   │   └── password-reset.txt  # Password reset email (plain text)
│   ├── orders/               # Order-related email templates
│   │   ├── order-confirmation.html # Order confirmation email (HTML)
│   │   ├── order-confirmation.txt  # Order confirmation email (plain text)
│   │   ├── shipping-notification.html # Shipping notification email (HTML)
│   │   └── shipping-notification.txt  # Shipping notification email (plain text)
│   └── marketing/            # Marketing email templates
│       ├── abandoned-cart.html # Abandoned cart email (HTML)
│       └── abandoned-cart.txt  # Abandoned cart email (plain text)
└── utils/                    # Utility functions for email processing
    ├── template-engine.ts    # Template rendering engine
    ├── personalization.ts    # Personalization utilities
    └── tracking.ts           # Email tracking utilities
```

## Template System

All email templates follow a consistent structure:

1. **Base Templates**: `base.html` and `base.txt` provide the common structure for all emails
2. **Template Variables**: Templates use Handlebars-style `{{variable}}` syntax for dynamic content
3. **Responsive Design**: HTML templates are responsive and work across all major email clients
4. **Dark Mode Support**: HTML templates include dark mode support with appropriate CSS
5. **Accessibility**: Templates are designed with accessibility in mind, including proper alt text and semantic structure

## Email Types

### Account Emails

- **Welcome Email**: Sent when a new user registers
- **Password Reset**: Sent when a user requests a password reset
- **Email Verification**: Sent to verify a user's email address
- **Account Update**: Sent when important account details are changed

### Order Emails

- **Order Confirmation**: Sent immediately after an order is placed
- **Shipping Notification**: Sent when an order ships with tracking information
- **Delivery Confirmation**: Sent when an order is delivered
- **Order Cancellation**: Sent when an order is cancelled

### Marketing Emails

- **Abandoned Cart**: Sent when a user abandons their shopping cart
- **Product Recommendations**: Sent with personalized product recommendations
- **Restock Notifications**: Sent when a waitlisted item is back in stock

## Usage

### Sending an Email

```typescript
import { EmailService } from '../services/email-service';

// Get email service from dependency injection
const emailService = services.email;

// Send a welcome email
await emailService.sendTemplatedEmail({
  templateName: 'account/welcome',
  recipient: {
    email: 'customer@example.com',
    name: 'John Doe'
  },
  subject: 'Welcome to GodWear!',
  data: {
    name: 'John',
    shopUrl: 'https://godwear.com/shop',
    // Other template variables
  },
  attachments: [] // Optional attachments
});
```

### Adding a New Template

1. Create both HTML and plain text versions of your template
2. Place them in the appropriate category directory
3. Use the base template structure for consistency
4. Test rendering with sample data
5. Test delivery across multiple email clients

## Best Practices

1. **Always include plain text**: Every HTML email should have a plain text alternative
2. **Responsive design**: All emails should look good on mobile devices
3. **Accessibility**: Use proper alt text, semantic structure, and color contrast
4. **Personalization**: Personalize emails with recipient data when possible
5. **Testing**: Test emails in multiple clients before sending to customers
6. **Tracking**: Include appropriate tracking for opens and clicks
7. **Compliance**: Include unsubscribe links and physical address in all marketing emails

## Email Service Configuration

The email service is configured in `app/services/registry.ts` and uses environment variables for API keys and other settings:

```typescript
// Environment variables for email service
MAILERSEND_API_KEY=your_api_key
MAILERSEND_FROM_EMAIL=noreply@godwear.com
MAILERSEND_FROM_NAME=GodWear
```

## Development and Testing

During development, emails can be sent to a test service that logs the email content instead of sending actual emails. Set the `EMAIL_TEST_MODE=true` environment variable to enable this behavior.
