import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { validateEmailTemplate } from "./test-utils";

/**
 * Visual testing configuration
 */
export interface VisualTestingConfig {
  /**
   * Template directory
   */
  templateDir: string;
  
  /**
   * Output directory for rendered templates
   */
  outputDir: string;
  
  /**
   * Test data for templates
   */
  testData: Record<string, any>;
}

/**
 * Default visual testing configuration
 */
export const defaultVisualTestingConfig: VisualTestingConfig = {
  templateDir: path.join(process.cwd(), "app/emails/templates"),
  outputDir: path.join(process.cwd(), "app/emails/testing/visual-output"),
  testData: {
    // Common data for all templates
    common: {
      logoUrl: "https://test.godwear.com/logo.png",
      supportEmail: "support@test.godwear.com",
      unsubscribeUrl: "https://test.godwear.com/unsubscribe?email=test@example.com",
      privacyUrl: "https://test.godwear.com/privacy",
      termsUrl: "https://test.godwear.com/terms",
      currentYear: new Date().getFullYear().toString(),
    },
    
    // Order confirmation test data
    "transactional/order-confirmation": {
      firstName: "John",
      orderNumber: "ORD-12345",
      orderDate: "July 21, 2025",
      items: [
        {
          name: "Performance T-Shirt",
          variant: "Medium / Black",
          quantity: 2,
          price: "$29.99",
          imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
        },
        {
          name: "Running Shorts",
          variant: "Large / Blue",
          quantity: 1,
          price: "$39.99",
          imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
        },
      ],
      subtotal: "$99.97",
      shipping: "$5.99",
      tax: "$10.60",
      total: "$116.56",
      shippingAddress: {
        name: "John Doe",
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
      },
      paymentMethod: "Credit Card (ending in 1234)",
      estimatedDelivery: "July 25-27, 2025",
      trackingNumber: "TRK123456789",
      trackingUrl: "https://test.godwear.com/track/TRK123456789",
      orderUrl: "https://test.godwear.com/orders/ORD-12345",
    },
    
    // Shipping notification test data
    "transactional/shipping-notification": {
      firstName: "John",
      orderNumber: "ORD-12345",
      orderDate: "July 21, 2025",
      shippedDate: "July 22, 2025",
      estimatedDelivery: "July 25-27, 2025",
      carrier: "FedEx",
      trackingNumber: "TRK123456789",
      trackingUrl: "https://test.godwear.com/track/TRK123456789",
      items: [
        {
          name: "Performance T-Shirt",
          variant: "Medium / Black",
          quantity: 2,
          imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
        },
        {
          name: "Running Shorts",
          variant: "Large / Blue",
          quantity: 1,
          imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
        },
      ],
      shippingAddress: {
        name: "John Doe",
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
      },
      orderUrl: "https://test.godwear.com/orders/ORD-12345",
    },
    
    // Password reset test data
    "security/password-reset": {
      firstName: "John",
      resetUrl: "https://test.godwear.com/reset-password?token=abc123",
      expiryHours: 24,
      expiryTime: "July 22, 2025, 3:00 PM",
      ipAddress: "192.168.1.1",
      device: "Chrome on Windows",
    },
    
    // Email verification test data
    "security/email-verification": {
      firstName: "John",
      verificationUrl: "https://test.godwear.com/verify-email?token=abc123",
      expiryHours: 24,
      expiryTime: "July 22, 2025, 3:00 PM",
    },
    
    // Order follow-up test data
    "marketing/order-followup": {
      firstName: "John",
      orderNumber: "ORD-12345",
      orderDate: "July 15, 2025",
      deliveryDate: "July 18, 2025",
      items: [
        {
          name: "Performance T-Shirt",
          variant: "Medium / Black",
          quantity: 2,
          price: "$29.99",
          imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
        },
        {
          name: "Running Shorts",
          variant: "Large / Blue",
          quantity: 1,
          price: "$39.99",
          imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
        },
      ],
      orderTotal: "$99.97",
      orderUrl: "https://test.godwear.com/orders/ORD-12345",
      reviewUrl: "https://test.godwear.com/orders/ORD-12345/review",
      discount: 10,
      discountCode: "THANKS10",
      discountExpiryDate: "July 28, 2025",
      recommendations: [
        {
          name: "Performance Running Shoes",
          price: "$89.99",
          imageUrl: "https://test.godwear.com/images/products/shoes-1.jpg",
          url: "https://test.godwear.com/products/performance-running-shoes",
        },
        {
          name: "Compression Leggings",
          price: "$59.99",
          imageUrl: "https://test.godwear.com/images/products/leggings-1.jpg",
          url: "https://test.godwear.com/products/compression-leggings",
        },
      ],
    },
    
    // Product review test data
    "marketing/product-review": {
      firstName: "John",
      orderNumber: "ORD-12345",
      orderDate: "July 15, 2025",
      product: {
        name: "Performance T-Shirt",
        variant: "Medium / Black",
        price: "$29.99",
        imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
      },
      reviewUrl: "https://test.godwear.com/products/product-1/review",
      incentive: "10% off your next purchase",
    },
    
    // Abandoned cart test data
    "marketing/abandoned-cart": {
      firstName: "John",
      items: [
        {
          name: "Performance T-Shirt",
          variant: "Medium / Black",
          quantity: 2,
          price: "$29.99",
          imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
        },
        {
          name: "Running Shorts",
          variant: "Large / Blue",
          quantity: 1,
          price: "$39.99",
          imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
        },
      ],
      cartTotal: "$99.97",
      cartUrl: "https://test.godwear.com/cart",
      discount: 15,
      discountCode: "COMEBACK15",
      expiryHours: 24,
      recommendations: [
        {
          name: "Performance Running Shoes",
          price: "$89.99",
          imageUrl: "https://test.godwear.com/images/products/shoes-1.jpg",
          url: "https://test.godwear.com/products/performance-running-shoes",
        },
        {
          name: "Compression Leggings",
          price: "$59.99",
          imageUrl: "https://test.godwear.com/images/products/leggings-1.jpg",
          url: "https://test.godwear.com/products/compression-leggings",
        },
      ],
    },
  },
};

/**
 * Render a template with test data
 */
export function renderTemplateForVisualTesting(
  templateName: string,
  config: VisualTestingConfig = defaultVisualTestingConfig
): { html: string; text: string } {
  // Read template files
  const htmlTemplatePath = path.join(config.templateDir, `${templateName}.html`);
  const textTemplatePath = path.join(config.templateDir, `${templateName}.txt`);
  
  const htmlTemplate = fs.readFileSync(htmlTemplatePath, "utf-8");
  const textTemplate = fs.readFileSync(textTemplatePath, "utf-8");
  
  // Compile templates
  const compiledHtml = Handlebars.compile(htmlTemplate);
  const compiledText = Handlebars.compile(textTemplate);
  
  // Merge common data with template-specific data
  const templateData = {
    ...config.testData.common,
    ...config.testData[templateName],
  };
  
  // Render templates
  const html = compiledHtml(templateData);
  const text = compiledText(templateData);
  
  return { html, text };
}

/**
 * Save rendered templates to files
 */
export function saveRenderedTemplate(
  templateName: string,
  html: string,
  text: string,
  config: VisualTestingConfig = defaultVisualTestingConfig
): void {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create template-specific directory
  const templateDir = path.dirname(templateName);
  const outputDir = path.join(config.outputDir, templateDir);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get template filename
  const templateFilename = path.basename(templateName);
  
  // Save HTML file
  const htmlFilePath = path.join(outputDir, `${templateFilename}.html`);
  fs.writeFileSync(htmlFilePath, html);
  
  // Save text file
  const textFilePath = path.join(outputDir, `${templateFilename}.txt`);
  fs.writeFileSync(textFilePath, text);
}

/**
 * Render and save all templates for visual testing
 */
export function renderAllTemplatesForVisualTesting(
  config: VisualTestingConfig = defaultVisualTestingConfig
): void {
  // Get all template names from test data
  const templateNames = Object.keys(config.testData).filter(key => key !== "common");
  
  // Render and save each template
  for (const templateName of templateNames) {
    try {
      const { html, text } = renderTemplateForVisualTesting(templateName, config);
      
      // Validate template
      if (validateEmailTemplate(html, text)) {
        saveRenderedTemplate(templateName, html, text, config);
        console.log(`✅ Successfully rendered and saved template: ${templateName}`);
      } else {
        console.error(`❌ Template validation failed: ${templateName}`);
      }
    } catch (error) {
      console.error(`❌ Error rendering template ${templateName}:`, error);
    }
  }
}

// Command-line interface
if (require.main === module) {
  renderAllTemplatesForVisualTesting();
}
