# Enhanced MailerSend Integration

## Overview

The enhanced MailerSend integration provides comprehensive email marketing capabilities with contact management, delivery tracking, and automated campaigns for the GodWear platform.

## Features

### 📧 **Email Services**
- **Welcome Emails**: Enhanced welcome emails with promotional content and contact management
- **Order Confirmations**: Professional order confirmation emails with detailed item breakdowns
- **Password Reset**: Secure password reset emails with time-limited tokens
- **Custom Notifications**: Flexible custom email sending with template support
- **Bulk Campaigns**: Marketing email campaigns to multiple recipients

### 👥 **Contact Management**
- **Automatic Contact Addition**: Add authenticated users to marketing contacts
- **Contact Search**: Find contacts by email address
- **Custom Fields**: Store additional user data and preferences
- **Contact Updates**: Update existing contact information
- **List Management**: Organize contacts into targeted lists

### 📊 **Analytics & Tracking**
- **Delivery Tracking**: Monitor email delivery, opens, clicks, and bounces
- **Campaign Analytics**: Track bulk email campaign performance
- **Health Monitoring**: Service health checks and API connectivity testing
- **Statistics Dashboard**: Comprehensive email statistics and reporting

### 🔒 **Security & Reliability**
- **API Error Handling**: Comprehensive error handling with retry logic
- **Configuration Validation**: Automatic service configuration testing
- **Secure Token Management**: Proper API key handling and validation
- **Rate Limiting**: Built-in protection against API rate limits

## API Endpoints

### Welcome Email
**POST** `/api/notifications/welcome`

Send enhanced welcome email with contact management.

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "addToContacts": true,
  "customFields": {
    "signup_source": "oauth",
    "user_type": "premium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456",
    "contactId": "contact_789"
  }
}
```

### Custom Email
**POST** `/api/notifications/send`

Send custom email notification with optional contact management.

```json
{
  "to": "user@example.com",
  "subject": "Your Custom Subject",
  "htmlContent": "<h1>HTML Content</h1>",
  "textContent": "Plain text content",
  "recipientName": "User Name",
  "addToContacts": true
}
```

### Order Confirmation
**POST** `/api/notifications/order-confirmation`

Send order confirmation email with detailed order information.

```json
{
  "email": "customer@example.com",
  "orderData": {
    "orderId": "ORD-12345",
    "customerName": "Customer Name",
    "items": [
      {
        "name": "Faith T-Shirt",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "total": 59.98,
    "shippingAddress": "123 Main St, City, State 12345"
  }
}
```

### Password Reset
**POST** `/api/notifications/password-reset`

Send secure password reset email.

```json
{
  "email": "user@example.com",
  "resetToken": "secure-reset-token",
  "userName": "User Name"
}
```

### Bulk Email Campaign
**POST** `/api/notifications/bulk-email`

Send marketing email to multiple recipients.

```json
{
  "recipients": [
    { "email": "user1@example.com", "name": "User One" },
    { "email": "user2@example.com", "name": "User Two" }
  ],
  "subject": "Newsletter Subject",
  "htmlContent": "<h1>Newsletter Content</h1>",
  "textContent": "Newsletter plain text",
  "tags": ["newsletter", "marketing"]
}
```

### Email Statistics
**GET** `/api/notifications/stats/{messageId}`

Get delivery statistics for a specific email.

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456",
    "delivered": 1,
    "opened": 1,
    "clicked": 0,
    "bounced": 0,
    "complained": 0,
    "timestamp": "2025-07-13T07:00:00.000Z"
  }
}
```

### Service Health Check
**GET** `/api/health/notifications`

Check MailerSend service health and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "message": "Enhanced notification service with MailerSend integration is operational",
    "details": {
      "mailerSendApiKey": true,
      "mailerSendService": true,
      "features": [
        "Contact Management",
        "Marketing Campaigns",
        "Delivery Tracking",
        "Bulk Email",
        "Enhanced Templates"
      ]
    }
  }
}
```

## Configuration

### Environment Variables

Required environment variables:

```bash
# MailerSend API Configuration
MAILERSEND_API_KEY=your-mailersend-api-key-here

# Optional Configuration
TEST_EMAIL=test@godwear.ca
NODE_ENV=production
PRODUCTION_DOMAIN=https://godwear.ca
```

### Service Initialization

The MailerSend service is automatically initialized in the NotificationService:

```typescript
// Automatic initialization
if (this.env.MAILERSEND_API_KEY) {
  this.mailerSendService = new MailerSendService(this.env.MAILERSEND_API_KEY);
}
```

## Email Templates

### Welcome Email Template

The welcome email includes:
- **Branded Header**: GodWear branding with gradient design
- **Welcome Bonus**: 10% discount code for new users
- **Feature Overview**: Account benefits and capabilities
- **Call-to-Action**: Direct link to shopping with UTM tracking
- **Unsubscribe Links**: GDPR-compliant unsubscribe options
- **Social Media Links**: Community engagement opportunities

### Order Confirmation Template

Features:
- **Order Details**: Complete item breakdown with quantities and prices
- **Shipping Information**: Delivery address and tracking details
- **Customer Support**: Direct contact information
- **Professional Styling**: Clean, branded design

### Password Reset Template

Security features:
- **Time-Limited Links**: 1-hour expiration for security
- **Security Warnings**: Clear messaging about unauthorized requests
- **Branded Design**: Consistent with GodWear styling
- **Fallback Options**: Manual link copying for accessibility

## Contact Management

### Automatic Contact Addition

When users authenticate or make purchases, they're automatically added to MailerSend contacts with:

```typescript
const contactData = {
  email: user.email,
  name: user.name,
  customFields: {
    signup_date: new Date().toISOString(),
    user_type: "authenticated",
    welcome_email_sent: true,
    source: "oauth_registration"
  }
};
```

### Custom Fields

Supported custom fields:
- `signup_date`: User registration timestamp
- `user_type`: User classification (authenticated, premium, etc.)
- `welcome_email_sent`: Welcome email delivery status
- `source`: Registration source (oauth, direct, etc.)
- `last_purchase`: Last purchase date
- `total_orders`: Total number of orders
- `preferred_categories`: Product preferences

## Analytics & Monitoring

### Email Delivery Tracking

All emails include tracking for:
- **Delivery Confirmation**: Email successfully delivered
- **Open Tracking**: Email opened by recipient
- **Click Tracking**: Links clicked within email
- **Bounce Tracking**: Failed delivery notifications
- **Complaint Tracking**: Spam/unsubscribe reports

### Campaign Performance

Bulk email campaigns provide:
- **Recipient Count**: Total emails sent
- **Delivery Rate**: Successful delivery percentage
- **Open Rate**: Email open percentage
- **Click-Through Rate**: Link click percentage
- **Unsubscribe Rate**: Opt-out tracking

### Health Monitoring

Service health checks include:
- **API Connectivity**: MailerSend API connection status
- **Configuration Validation**: Required environment variables
- **Service Availability**: Overall service operational status
- **Feature Status**: Individual feature availability

## Error Handling

### Comprehensive Error Management

The integration includes robust error handling:

```typescript
// API Error Handling
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`MailerSend API error: ${response.status} - ${errorText}`);
}

// Service Error Handling
try {
  const result = await this.mailerSendService.sendEmail(...);
  if (!result.success) {
    return { success: false, error: result.error };
  }
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error"
  };
}
```

### Error Types

Common error scenarios:
- **API Key Invalid**: Incorrect or expired API key
- **Rate Limiting**: Too many requests to MailerSend API
- **Invalid Email**: Malformed email addresses
- **Template Errors**: HTML/text content issues
- **Network Failures**: Connectivity problems

## Testing

### Comprehensive Test Suite

Run the test suite to verify all functionality:

```bash
node test-mailersend-integration.js
```

### Test Coverage

The test suite covers:
- **Welcome Email**: Contact management integration
- **Custom Notifications**: Flexible email sending
- **Order Confirmations**: E-commerce email templates
- **Password Reset**: Security email functionality
- **Bulk Campaigns**: Marketing email capabilities
- **Health Checks**: Service monitoring
- **Configuration**: API connectivity testing
- **Statistics**: Analytics and reporting

### Manual Testing

For manual testing:

1. **Start Development Server**: `npm run dev`
2. **Configure API Key**: Set `MAILERSEND_API_KEY` in `.env`
3. **Run Health Check**: `GET /api/health/notifications`
4. **Send Test Email**: Use any email endpoint
5. **Verify Delivery**: Check MailerSend dashboard

## Performance Considerations

### Optimization Features

- **Batch Processing**: Bulk email sending for efficiency
- **Connection Pooling**: Reuse HTTP connections
- **Error Retry Logic**: Automatic retry for transient failures
- **Rate Limiting**: Respect MailerSend API limits
- **Caching**: Cache contact lookups where appropriate

### Scalability

The integration is designed for scale:
- **Async Operations**: Non-blocking email sending
- **Queue Support**: Ready for background job integration
- **Database Integration**: Efficient contact management
- **Monitoring**: Comprehensive health and performance tracking

## Security Best Practices

### Data Protection

- **API Key Security**: Secure environment variable storage
- **Email Validation**: Input sanitization and validation
- **Unsubscribe Compliance**: GDPR/CAN-SPAM compliance
- **Rate Limiting**: Protection against abuse
- **Error Logging**: Secure error handling without data exposure

### Privacy Compliance

- **Consent Management**: Opt-in/opt-out handling
- **Data Retention**: Configurable data retention policies
- **Unsubscribe Links**: One-click unsubscribe options
- **Privacy Policy**: Clear privacy policy references
- **Data Minimization**: Only collect necessary information

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify API key in MailerSend dashboard
   - Check environment variable configuration
   - Ensure API key has required permissions

2. **Emails Not Sending**
   - Check service health endpoint
   - Verify domain configuration in MailerSend
   - Review error logs for specific issues

3. **Contact Management Issues**
   - Verify contact API permissions
   - Check for duplicate email addresses
   - Review custom field configurations

4. **Template Rendering Problems**
   - Validate HTML content structure
   - Check for special character encoding
   - Test with plain text fallback

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This provides detailed logging for:
- API requests and responses
- Contact management operations
- Email delivery attempts
- Error details and stack traces

## Future Enhancements

### Planned Features

- **Template Management**: Visual email template editor
- **A/B Testing**: Campaign optimization testing
- **Segmentation**: Advanced contact segmentation
- **Automation**: Drip campaigns and workflows
- **Advanced Analytics**: Detailed reporting dashboard
- **Integration APIs**: Third-party service integrations

### Roadmap

1. **Q1 2025**: Template management system
2. **Q2 2025**: Advanced segmentation features
3. **Q3 2025**: Marketing automation workflows
4. **Q4 2025**: Advanced analytics dashboard

## Conclusion

The enhanced MailerSend integration provides a comprehensive email marketing solution for GodWear, combining reliable email delivery with advanced contact management and analytics. The system is designed for scalability, security, and ease of use while maintaining compliance with modern privacy regulations.
