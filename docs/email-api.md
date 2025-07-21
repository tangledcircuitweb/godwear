# GodWear Email API Documentation

This document provides detailed documentation for the GodWear Email API, including endpoints, request/response formats, and examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Response Format](#response-format)
4. [Email Sending](#email-sending)
   - [Send Email](#send-email)
   - [Send Batch Emails](#send-batch-emails)
   - [Schedule Email](#schedule-email)
5. [Email Management](#email-management)
   - [Resend Email](#resend-email)
   - [Get Email Status](#get-email-status)
   - [Cancel Email](#cancel-email)
6. [Email Analytics](#email-analytics)
   - [Get Email Events](#get-email-events)
   - [Get Email Metrics](#get-email-metrics)
   - [Get Email Health](#get-email-health)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Webhooks](#webhooks)

## Authentication

All API requests require authentication using an API key. The API key should be included in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Base URL

The base URL for all API endpoints is:

```
https://api.godwear.com/api
```

## Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Email Sending

### Send Email

Send a single email, either raw or templated.

**Endpoint:** `POST /emails/send`

#### Request Body

For raw emails:

```json
{
  "type": "raw",
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Hello World",
  "html": "<p>Hello World</p>",
  "text": "Hello World",
  "priority": "medium",
  "scheduledFor": "2025-07-22T12:00:00Z",
  "idempotencyKey": "unique-key-123",
  "metadata": {
    "orderId": "order-123",
    "customerId": "customer-456"
  }
}
```

For templated emails:

```json
{
  "type": "templated",
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Hello World",
  "templateName": "welcome",
  "templateData": {
    "name": "John Doe",
    "verificationUrl": "https://godwear.com/verify?token=abc123"
  },
  "priority": "medium",
  "scheduledFor": "2025-07-22T12:00:00Z",
  "idempotencyKey": "unique-key-123",
  "metadata": {
    "orderId": "order-123",
    "customerId": "customer-456"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "email-123",
    "success": true,
    "messageId": "message-123",
    "timestamp": "2025-07-21T23:00:00Z",
    "provider": "mailersend",
    "recipient": "recipient@example.com",
    "subject": "Hello World",
    "status": "queued"
  }
}
```

### Send Batch Emails

Send multiple emails in a single request.

**Endpoint:** `POST /emails/batch`

#### Request Body

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
  ],
  "batchId": "batch-123"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "batchId": "batch-123",
    "totalEmails": 2,
    "successCount": 2,
    "failureCount": 0,
    "results": [
      {
        "id": "email-123",
        "success": true,
        "messageId": "message-123",
        "timestamp": "2025-07-21T23:00:00Z",
        "provider": "mailersend",
        "recipient": "recipient1@example.com",
        "subject": "Hello World",
        "status": "queued"
      },
      {
        "id": "email-124",
        "success": true,
        "messageId": "message-124",
        "timestamp": "2025-07-21T23:00:00Z",
        "provider": "mailersend",
        "recipient": "recipient2@example.com",
        "subject": "Hello World",
        "status": "queued"
      }
    ]
  }
}
```

### Schedule Email

Schedule an email for future delivery.

**Endpoint:** `POST /emails/schedule`

#### Request Body

```json
{
  "email": {
    "type": "raw",
    "to": "recipient@example.com",
    "subject": "Scheduled Email",
    "html": "<p>This email was scheduled</p>",
    "text": "This email was scheduled"
  },
  "scheduledFor": "2025-07-22T12:00:00Z"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "email-123",
    "success": true,
    "messageId": "message-123",
    "timestamp": "2025-07-21T23:00:00Z",
    "provider": "queue",
    "recipient": "recipient@example.com",
    "subject": "Scheduled Email",
    "status": "scheduled",
    "scheduledFor": "2025-07-22T12:00:00Z"
  }
}
```

## Email Management

### Resend Email

Resend an email, optionally to a new recipient.

**Endpoint:** `POST /emails/resend`

#### Request Body

```json
{
  "emailId": "email-123",
  "updateRecipient": true,
  "newRecipient": {
    "email": "new-recipient@example.com",
    "name": "New Recipient"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "email-124",
    "success": true,
    "messageId": "message-124",
    "timestamp": "2025-07-21T23:00:00Z",
    "provider": "mailersend",
    "recipient": "new-recipient@example.com",
    "subject": "Resent Email",
    "status": "queued"
  }
}
```

### Get Email Status

Get the status of an email.

**Endpoint:** `GET /emails/:emailId/status`

#### Response

```json
{
  "success": true,
  "data": {
    "id": "email-123",
    "status": "delivered",
    "events": [
      {
        "type": "sent",
        "timestamp": "2025-07-21T23:00:00Z"
      },
      {
        "type": "delivered",
        "timestamp": "2025-07-21T23:00:05Z"
      },
      {
        "type": "opened",
        "timestamp": "2025-07-21T23:05:00Z"
      }
    ],
    "recipient": "recipient@example.com",
    "subject": "Hello World",
    "sentAt": "2025-07-21T23:00:00Z",
    "deliveredAt": "2025-07-21T23:00:05Z",
    "openedAt": "2025-07-21T23:05:00Z",
    "metadata": {
      "orderId": "order-123",
      "customerId": "customer-456"
    }
  }
}
```

### Cancel Email

Cancel a scheduled email.

**Endpoint:** `POST /emails/cancel`

#### Request Body

```json
{
  "emailId": "email-123"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "email-123",
    "success": true,
    "messageId": "message-123",
    "timestamp": "2025-07-21T23:00:00Z",
    "provider": "queue",
    "recipient": "recipient@example.com",
    "subject": "Scheduled Email",
    "status": "cancelled"
  }
}
```

## Email Analytics

### Get Email Events

Get email events for a specific time period.

**Endpoint:** `GET /email-analytics/events`

#### Query Parameters

- `startDate` (required): Start date for events (ISO 8601 format)
- `endDate` (optional): End date for events (ISO 8601 format)
- `userId` (optional): Filter by user ID
- `recipientEmail` (optional): Filter by recipient email
- `eventTypes` (optional): Comma-separated list of event types
- `campaignId` (optional): Filter by campaign ID
- `templateName` (optional): Filter by template name
- `limit` (optional): Maximum number of events to return
- `offset` (optional): Offset for pagination

#### Response

```json
{
  "success": true,
  "data": {
    "totalCount": 3,
    "events": [
      {
        "id": "event-123",
        "emailId": "email-123",
        "userId": "user-123",
        "recipientEmail": "recipient@example.com",
        "eventType": "sent",
        "timestamp": "2025-07-21T23:00:00Z",
        "provider": "mailersend",
        "campaignId": "campaign-123",
        "templateName": "welcome"
      },
      {
        "id": "event-124",
        "emailId": "email-123",
        "userId": "user-123",
        "recipientEmail": "recipient@example.com",
        "eventType": "delivered",
        "timestamp": "2025-07-21T23:00:05Z",
        "provider": "mailersend",
        "campaignId": "campaign-123",
        "templateName": "welcome"
      },
      {
        "id": "event-125",
        "emailId": "email-123",
        "userId": "user-123",
        "recipientEmail": "recipient@example.com",
        "eventType": "opened",
        "timestamp": "2025-07-21T23:05:00Z",
        "provider": "mailersend",
        "campaignId": "campaign-123",
        "templateName": "welcome"
      }
    ]
  }
}
```

### Get Email Metrics

Get email metrics for a specific time period.

**Endpoint:** `GET /email-analytics/metrics`

#### Query Parameters

- `startDate` (required): Start date for metrics (ISO 8601 format)
- `endDate` (optional): End date for metrics (ISO 8601 format)
- `userId` (optional): Filter by user ID
- `recipientEmail` (optional): Filter by recipient email
- `campaignId` (optional): Filter by campaign ID
- `templateName` (optional): Filter by template name
- `groupBy` (optional): Group metrics by day, week, month, campaign, or template

#### Response

```json
{
  "success": true,
  "data": {
    "overall": {
      "sent": 100,
      "delivered": 95,
      "opened": 50,
      "clicked": 25,
      "bounced": 5,
      "complained": 1,
      "unsubscribed": 2,
      "deliveryRate": 0.95,
      "openRate": 0.526,
      "clickRate": 0.263,
      "bounceRate": 0.05,
      "complaintRate": 0.011,
      "unsubscribeRate": 0.021,
      "clickToOpenRate": 0.5
    },
    "breakdown": [
      {
        "key": "welcome",
        "metrics": {
          "sent": 50,
          "delivered": 48,
          "opened": 30,
          "clicked": 15,
          "bounced": 2,
          "complained": 0,
          "unsubscribed": 1,
          "deliveryRate": 0.96,
          "openRate": 0.625,
          "clickRate": 0.313,
          "bounceRate": 0.04,
          "complaintRate": 0,
          "unsubscribeRate": 0.021,
          "clickToOpenRate": 0.5
        }
      },
      {
        "key": "order-confirmation",
        "metrics": {
          "sent": 50,
          "delivered": 47,
          "opened": 20,
          "clicked": 10,
          "bounced": 3,
          "complained": 1,
          "unsubscribed": 1,
          "deliveryRate": 0.94,
          "openRate": 0.426,
          "clickRate": 0.213,
          "bounceRate": 0.06,
          "complaintRate": 0.021,
          "unsubscribeRate": 0.021,
          "clickToOpenRate": 0.5
        }
      }
    ]
  }
}
```

### Get Email Health

Get the health status of the email system.

**Endpoint:** `GET /email-analytics/health`

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "message": "Email analytics service is operational",
    "details": {
      "eventCount": 1000,
      "memoryUsage": 1234567,
      "queue": {
        "total": 10,
        "pending": 5,
        "processing": 2,
        "completed": 2,
        "failed": 1
      },
      "stats": {
        "processed": 100,
        "successful": 95,
        "failed": 5,
        "retried": 3,
        "cancelled": 0,
        "rateDelayed": 2,
        "domainDelayed": 1
      }
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: The authenticated user does not have permission to access the resource
- `404 Not Found`: The requested resource was not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: An error occurred on the server

Error responses include an error message:

```json
{
  "success": false,
  "error": "Invalid email address"
}
```

## Rate Limiting

The API enforces rate limits to prevent abuse. Rate limits are applied per API key and vary by endpoint:

- Email sending: 100 requests per minute
- Email management: 300 requests per minute
- Email analytics: 60 requests per minute

Rate limit headers are included in all responses:

- `X-RateLimit-Limit`: The maximum number of requests allowed per minute
- `X-RateLimit-Remaining`: The number of requests remaining in the current minute
- `X-RateLimit-Reset`: The time at which the rate limit will reset (Unix timestamp)

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response.

## Webhooks

The API provides webhooks for real-time event notifications:

### Email Events Webhook

**Endpoint:** `POST /api/tracking/webhook/:provider`

#### Request Headers

- `X-Webhook-Signature`: Signature for webhook verification

#### Request Body

The request body varies by provider. See the provider-specific documentation for details:

- [MailerSend Webhook Documentation](https://developers.mailersend.com/api/v1/webhooks.html)
- [SendGrid Webhook Documentation](https://docs.sendgrid.com/for-developers/tracking-events/event)
