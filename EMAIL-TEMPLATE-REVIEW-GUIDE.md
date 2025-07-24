# Email Template Review Guide

## Overview
This guide explains how to send GodWear email templates for review using the automated email sending system.

## Quick Start

### 1. Send Templates for Review
```bash
cd /home/tangled/godwear
npx tsx send-template-review.ts
```

### 2. What It Does
- Reads processed templates from `app/emails/testing/`
- Sends them via MailerSend API to `njordrenterprises@gmail.com`
- Includes comprehensive mock data for realistic preview
- Verifies theme compliance and responsiveness

## Script Configuration

### Current Templates in Script
The `send-template-review.ts` script is configured to send:

1. **Welcome Template** - `processed-welcome-dual-theme.html`
2. **Delivery Out for Delivery** - `processed-delivery-out_for_delivery.html`  
3. **Delivery Delivered** - `processed-delivery-delivered.html`
4. **Partial Shipment** - `processed-partial-shipment.html`

### Adding New Templates

To add a new template to the review system:

1. **Process the template** using the test script:
   ```bash
   npx vitest run app/emails/testing/send-template-review.test.ts
   ```

2. **Add to the templates array** in `send-template-review.ts`:
   ```typescript
   const templates: Template[] = [
     // ... existing templates
     {
       name: 'your-template-name',
       file: 'processed-your-template-name.html',
       subject: 'GodWear Template Review - Your Template Name (Fixed Theme)'
     }
   ];
   ```

3. **Run the updated script**:
   ```bash
   npx tsx send-template-review.ts
   ```

## Template Processing

### 1. Template Processing Script
Location: `app/emails/testing/send-template-review.test.ts`

This script:
- Reads raw templates from `app/emails/templates/`
- Processes them with comprehensive mock data
- Saves processed versions to `app/emails/testing/`
- Verifies theme compliance and responsiveness

### 2. Mock Data Structure
Each template gets realistic mock data including:
- Customer information (Sarah Grace Johnson)
- Order details with GodWear products
- Shipping addresses and tracking information
- Christian-themed product names and descriptions

### 3. Theme Verification
The processing script verifies:
- ✅ White, silver, gold glassmorphism theme
- ✅ Mobile responsiveness (`@media` queries)
- ✅ Glassmorphism effects (`backdrop-filter: blur`)

## Email Sending Process

### 1. Environment Setup
Ensure `.env` file contains:
```env
MAILERSEND_API_KEY=your-mailersend-api-key
TEST_EMAIL=templates@godwear.ca
```

### 2. Email Configuration
- **From**: `templates@godwear.ca` (GodWear Template Review)
- **To**: `njordrenterprises@gmail.com`
- **Format**: HTML with text fallback
- **Delay**: 1 second between emails

### 3. Success Indicators
Look for these in the output:
```
✅ template-name sent successfully!
📧 Message ID: [mailersend-id]
📊 Response status: 202
```

## File Structure

```
/home/tangled/godwear/
├── send-template-review.ts              # Main email sending script
├── app/emails/testing/
│   ├── send-template-review.test.ts     # Template processing script
│   ├── processed-*.html                 # Processed templates ready for email
│   └── comprehensive-template.test.ts   # Additional testing utilities
└── app/emails/templates/               # Raw template files
    ├── account/
    ├── orders/
    ├── marketing/
    ├── security/
    └── transactional/
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   ❌ MAILERSEND_API_KEY not found in .env file
   ```
   **Solution**: Ensure `.env` file exists with valid MailerSend API key

2. **Template File Not Found**
   ```
   ❌ Error with template-name: ENOENT: no such file
   ```
   **Solution**: Run the processing script first to generate processed templates

3. **Email Send Failed**
   ```
   ❌ template-name send failed: 422
   ```
   **Solution**: Check MailerSend API limits and email format

### Verification Steps

1. **Check processed templates exist**:
   ```bash
   ls -la app/emails/testing/processed-*.html
   ```

2. **Test MailerSend connection**:
   ```bash
   node test-mailersend-auth.js
   ```

3. **Verify template processing**:
   ```bash
   npx vitest run app/emails/testing/send-template-review.test.ts
   ```

## Template Review Workflow

1. **Fix template** → Update raw template in `app/emails/templates/`
2. **Process template** → Run `send-template-review.test.ts`
3. **Send for review** → Run `send-template-review.ts`
4. **Check email** → Review at `njordrenterprises@gmail.com`
5. **Iterate** → Repeat until approved

## Notes

- All templates use **white, silver, gold glassmorphism** theme
- Templates are **mobile-first responsive** design
- **Email client compatibility** tested for Outlook, Gmail, Apple Mail
- **Christian branding** with appropriate scripture integration
- **Mock data** includes realistic GodWear product information

## Last Updated
January 23, 2025 - Updated with delivery templates and welcome email restoration
