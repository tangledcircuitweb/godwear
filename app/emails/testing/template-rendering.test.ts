import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { validateEmailTemplate } from "./test-utils";

// Define the template directory
const TEMPLATE_DIR = path.join(process.cwd(), "app/emails/templates");

// Helper function to read a template file
function readTemplate(templateName: string, type: "html" | "txt"): string {
  const extension = type === "html" ? "html" : "txt";
  const filePath = path.join(TEMPLATE_DIR, `${templateName}.${extension}`);
  return fs.readFileSync(filePath, "utf-8");
}

// Helper function to render a template with data
function renderTemplate(templateName: string, data: Record<string, any>): { html: string; text: string } {
  const htmlTemplate = readTemplate(templateName, "html");
  const textTemplate = readTemplate(templateName, "txt");
  
  const compiledHtml = Handlebars.compile(htmlTemplate);
  const compiledText = Handlebars.compile(textTemplate);
  
  return {
    html: compiledHtml(data),
    text: compiledText(data),
  };
}

describe("Email Template Rendering", () => {
  // Test data for templates
  const testData = {
    // Order confirmation test data
    orderConfirmation: {
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
      logoUrl: "https://test.godwear.com/logo.png",
      supportEmail: "support@test.godwear.com",
      currentYear: "2025",
    },
    
    // Shipping notification test data
    shippingNotification: {
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
      logoUrl: "https://test.godwear.com/logo.png",
      supportEmail: "support@test.godwear.com",
      currentYear: "2025",
    },
    
    // Password reset test data
    passwordReset: {
      firstName: "John",
      resetUrl: "https://test.godwear.com/reset-password?token=abc123",
      expiryHours: 24,
      expiryTime: "July 22, 2025, 3:00 PM",
      ipAddress: "192.168.1.1",
      device: "Chrome on Windows",
      logoUrl: "https://test.godwear.com/logo.png",
      supportEmail: "support@test.godwear.com",
      currentYear: "2025",
    },
    
    // Order follow-up test data
    orderFollowup: {
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
      logoUrl: "https://test.godwear.com/logo.png",
      supportEmail: "support@test.godwear.com",
      unsubscribeUrl: "https://test.godwear.com/unsubscribe?email=john@example.com",
      privacyUrl: "https://test.godwear.com/privacy",
      termsUrl: "https://test.godwear.com/terms",
      currentYear: "2025",
    },
  };

  // Test each template
  describe("Order Confirmation Template", () => {
    it("should render valid HTML and text", () => {
      const { html, text } = renderTemplate("transactional/order-confirmation", testData.orderConfirmation);
      
      expect(validateEmailTemplate(html, text)).toBe(true);
      expect(html).toContain(testData.orderConfirmation.orderNumber);
      expect(html).toContain(testData.orderConfirmation.total);
      expect(text).toContain(testData.orderConfirmation.orderNumber);
      expect(text).toContain(testData.orderConfirmation.total);
    });
    
    it("should include all required information", () => {
      const { html, text } = renderTemplate("transactional/order-confirmation", testData.orderConfirmation);
      
      // Check for order details
      expect(html).toContain(testData.orderConfirmation.orderNumber);
      expect(html).toContain(testData.orderConfirmation.orderDate);
      
      // Check for item details
      testData.orderConfirmation.items.forEach(item => {
        expect(html).toContain(item.name);
        expect(html).toContain(item.price);
      });
      
      // Check for pricing details
      expect(html).toContain(testData.orderConfirmation.subtotal);
      expect(html).toContain(testData.orderConfirmation.shipping);
      expect(html).toContain(testData.orderConfirmation.tax);
      expect(html).toContain(testData.orderConfirmation.total);
      
      // Check for shipping details
      expect(html).toContain(testData.orderConfirmation.shippingAddress.name);
      expect(html).toContain(testData.orderConfirmation.shippingAddress.street);
      
      // Check for tracking information
      expect(html).toContain(testData.orderConfirmation.trackingNumber);
      expect(html).toContain(testData.orderConfirmation.estimatedDelivery);
    });
  });

  describe("Shipping Notification Template", () => {
    it("should render valid HTML and text", () => {
      const { html, text } = renderTemplate("transactional/shipping-notification", testData.shippingNotification);
      
      expect(validateEmailTemplate(html, text)).toBe(true);
      expect(html).toContain(testData.shippingNotification.trackingNumber);
      expect(text).toContain(testData.shippingNotification.trackingNumber);
    });
    
    it("should include all required information", () => {
      const { html, text } = renderTemplate("transactional/shipping-notification", testData.shippingNotification);
      
      // Check for shipping details
      expect(html).toContain(testData.shippingNotification.orderNumber);
      expect(html).toContain(testData.shippingNotification.shippedDate);
      expect(html).toContain(testData.shippingNotification.estimatedDelivery);
      expect(html).toContain(testData.shippingNotification.carrier);
      expect(html).toContain(testData.shippingNotification.trackingNumber);
      
      // Check for item details
      testData.shippingNotification.items.forEach(item => {
        expect(html).toContain(item.name);
      });
      
      // Check for address details
      expect(html).toContain(testData.shippingNotification.shippingAddress.name);
      expect(html).toContain(testData.shippingNotification.shippingAddress.street);
    });
  });

  describe("Password Reset Template", () => {
    it("should render valid HTML and text", () => {
      const { html, text } = renderTemplate("security/password-reset", testData.passwordReset);
      
      expect(validateEmailTemplate(html, text)).toBe(true);
      expect(html).toContain("Reset Your Password");
      expect(text).toContain("Reset Your Password");
    });
    
    it("should include all required information", () => {
      const { html, text } = renderTemplate("security/password-reset", testData.passwordReset);
      
      // Check for reset details
      expect(html).toContain(testData.passwordReset.resetUrl);
      expect(html).toContain(testData.passwordReset.expiryHours.toString());
      expect(html).toContain(testData.passwordReset.expiryTime);
      
      // Check for security information
      expect(html).toContain(testData.passwordReset.ipAddress);
      expect(html).toContain(testData.passwordReset.device);
    });
  });

  describe("Order Follow-up Template", () => {
    it("should render valid HTML and text", () => {
      const { html, text } = renderTemplate("marketing/order-followup", testData.orderFollowup);
      
      expect(validateEmailTemplate(html, text)).toBe(true);
      expect(html).toContain("How was your order?");
      expect(text).toContain("HOW WAS YOUR ORDER?");
    });
    
    it("should include all required information", () => {
      const { html, text } = renderTemplate("marketing/order-followup", testData.orderFollowup);
      
      // Check for order details
      expect(html).toContain(testData.orderFollowup.orderNumber);
      expect(html).toContain(testData.orderFollowup.orderDate);
      expect(html).toContain(testData.orderFollowup.deliveryDate);
      
      // Check for item details
      testData.orderFollowup.items.forEach(item => {
        expect(html).toContain(item.name);
      });
      
      // Check for discount information
      expect(html).toContain(testData.orderFollowup.discount.toString());
      expect(html).toContain(testData.orderFollowup.discountCode);
      expect(html).toContain(testData.orderFollowup.discountExpiryDate);
      
      // Check for recommendations
      testData.orderFollowup.recommendations.forEach(item => {
        expect(html).toContain(item.name);
        expect(html).toContain(item.price);
      });
    });
    
    it("should handle missing discount information", () => {
      const dataWithoutDiscount = { ...testData.orderFollowup, discount: undefined, discountCode: undefined, discountExpiryDate: undefined };
      const { html, text } = renderTemplate("marketing/order-followup", dataWithoutDiscount);
      
      expect(validateEmailTemplate(html, text)).toBe(true);
      expect(html).not.toContain("Special Offer Just For You");
    });
  });
});
