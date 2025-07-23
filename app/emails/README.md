# GodWear Email Template System

## Overview

This email template system provides comprehensive mock data for testing all your Christian-themed email templates. It ensures that all `{{variable}}` placeholders in your templates are populated with realistic, production-ready data.

## 🎯 Key Features

- **Complete Mock Data**: Covers all variables found in your email templates
- **Christian Branding**: All mock data reflects GodWear's faith-based brand
- **Multiple Personas**: 5 different customer personas for diverse testing
- **Production Ready**: Data structure matches what your production system will provide
- **Template Processing**: Automatic variable replacement and template rendering

## 📁 File Structure

```
app/emails/
├── data/
│   └── template-data.ts          # Mock data generators and schemas
├── services/
│   └── template-email-service.ts # Production email service integration
├── testing/
│   ├── template-data-demo.test.ts # Demonstration tests
│   ├── processed/                # Generated template previews
│   ├── processed-welcome.html    # Example processed templates
│   └── processed-order-confirmation.html
└── templates/                    # Your existing email templates
    ├── account/
    ├── orders/
    ├── marketing/
    └── ...
```

## 🚀 Quick Start

### 1. Generate Mock Data

```typescript
import {
  generateOrderTemplateData,
  generateAccountTemplateData,
  generateMarketingTemplateData,
} from './data/template-data';

// Generate order data
const orderData = generateOrderTemplateData();
console.log(orderData.name);        // "Sarah Grace"
console.log(orderData.orderNumber); // "GW-2024-001234"
console.log(orderData.total);       // "$118.40"

// Generate account data
const accountData = generateAccountTemplateData();
console.log(accountData.resetUrl);  // "https://godwear.com/reset-password?token=..."
console.log(accountData.ipAddress); // "192.168.1.100"
```

### 2. Process Templates

```typescript
import { processTemplate } from './data/template-data';

const template = "Hello {{name}}, your order {{orderNumber}} is confirmed!";
const data = generateOrderTemplateData();

const processed = processTemplate(template, data);
// Result: "Hello Sarah Grace, your order GW-2024-001234 is confirmed!"
```

### 3. Use Different Personas

```typescript
import { generateTemplateDataForPersona, CUSTOMER_PERSONAS } from './data/template-data';

// Available personas: sarah, michael, rebecca, david, mary
const michaelOrder = generateTemplateDataForPersona("michael", "order");
console.log(michaelOrder.name); // "Michael Faith"

const rebeccaAccount = generateTemplateDataForPersona("rebecca", "account");
console.log(rebeccaAccount.name); // "Rebecca Joy"
```

## 📧 Template Variables Covered

### Common Variables (All Templates)
- `{{name}}` - Customer name
- `{{logoUrl}}` - Company logo URL
- `{{supportEmail}}` - Support email (blessings@godwear.com)
- `{{currentYear}}` - Current year
- `{{unsubscribeUrl}}`, `{{privacyUrl}}`, `{{termsUrl}}` - Footer links

### Order Templates
- `{{orderNumber}}`, `{{orderDate}}`, `{{paymentMethod}}`
- `{{items}}` array with product details
- `{{subtotal}}`, `{{shipping}}`, `{{tax}}`, `{{discount}}`, `{{total}}`
- `{{shippingAddress}}`, `{{billingAddress}}` objects
- `{{estimatedDelivery}}`, `{{trackOrderUrl}}`

### Account Templates
- `{{resetUrl}}`, `{{verificationUrl}}`
- `{{ipAddress}}`, `{{device}}`, `{{timestamp}}`

### Marketing Templates
- `{{productName}}`, `{{productUrl}}`, `{{reviewUrl}}`
- `{{discountCode}}`, `{{discountAmount}}`

## 🛠 Production Integration

### Using the Template Email Service

```typescript
import { TemplateEmailService } from './services/template-email-service';

const emailService = new TemplateEmailService();

// Process a template for production use
const result = await emailService.processEmailTemplate({
  templateName: 'welcome',
  templateType: 'account',
  recipientEmail: 'customer@example.com',
  recipientName: 'John Doe',
  customData: {
    // Override any default values
    welcomeBonus: '$5.00',
  }
});

if (result.success) {
  console.log('HTML:', result.processedHtml);
  console.log('Text:', result.processedText);
  console.log('Data Used:', result.templateData);
}
```

### Preview Templates

```typescript
// Preview a template with mock data
const preview = await emailService.previewTemplate('orders', 'order-confirmation', 'sarah');
console.log('HTML Preview:', preview.html);
console.log('Mock Data:', preview.data);
```

## 🎨 Christian Product Examples

The mock data includes realistic Christian-themed products:

- **Faith Over Fear T-Shirt** - $29.99
- **Blessed & Grateful Hoodie** - $49.99  
- **Proverbs 31 Woman Mug** - $19.99
- **Jesus Loves You Keychain** - $12.99
- **Scripture Memory Cards Set** - $24.99

## 👥 Customer Personas

Five diverse Christian customer personas:

- **Sarah Grace** - Primary persona
- **Michael Faith** - Male customer
- **Rebecca Joy** - Young adult
- **David Hope** - Family man
- **Mary Blessing** - Senior customer

## 🧪 Testing

Run the demonstration tests:

```bash
# Run all template data tests
npx vitest run app/emails/testing/template-data-demo.test.ts

# Run with UI for detailed results
npx vitest --ui app/emails/testing/template-data-demo.test.ts
```

The tests will:
- Generate mock data for all template types
- Process your actual email templates
- Save processed templates to `app/emails/testing/processed/`
- Validate all required data fields are present

## 📋 Template Processing Features

### Simple Variables
```html
Hello {{name}}, welcome to GodWear!
<!-- Becomes: Hello Sarah Grace, welcome to GodWear! -->
```

### Nested Objects
```html
Shipping to: {{shippingAddress.name}} at {{shippingAddress.street}}
<!-- Becomes: Shipping to: Sarah Grace at 123 Blessing Boulevard -->
```

### Array Iterations
```html
{{#each items}}
  <div>{{this.name}} - {{this.price}}</div>
{{/each}}
<!-- Becomes: Multiple product divs -->
```

### Conditional Blocks
```html
{{#if discount}}
  <div>Discount: {{discount}}</div>
{{/if}}
<!-- Shows discount section only if discount exists -->
```

## 🔧 Customization

### Adding New Variables

1. Update the schema in `template-data.ts`:
```typescript
const CustomTemplateDataSchema = CommonTemplateDataSchema.extend({
  newVariable: z.string(),
});
```

2. Update the generator function:
```typescript
export function generateCustomTemplateData() {
  return {
    ...generateCommonTemplateData(),
    newVariable: "Custom Value",
  };
}
```

### Adding New Personas

```typescript
export const CUSTOMER_PERSONAS = {
  // ... existing personas
  newPersona: {
    name: "New Customer",
    email: "new@example.com",
  },
};
```

## 🚀 Production Deployment

When ready for production:

1. **Replace Mock Data**: Update the template service to use real customer data instead of mock data
2. **Integrate Email Provider**: Connect to your actual email service (MailerSend, etc.)
3. **Template Validation**: Use the mock data system to validate all templates work correctly
4. **Testing**: Run comprehensive tests with the mock data before deployment

## 📞 Support

For questions about the email template system:
- Check the test files for usage examples
- Review the generated processed templates in `app/emails/testing/processed/`
- Run the demo tests to see the system in action

---

*"Give thanks in all circumstances" - 1 Thessalonians 5:18*

**GodWear Email Template System - Where Faith Meets Technology** ✨
