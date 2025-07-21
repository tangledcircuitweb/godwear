import { describe, it, expect, beforeEach } from "vitest";
import { OrderConfirmationEmail } from "../implementations/order-confirmation";
import { ShippingNotificationEmail } from "../implementations/shipping-notification";
import { AccountSecurityEmail } from "../implementations/account-security";
import { MarketingEmail } from "../implementations/marketing-emails";
import { createEmailTestEnvironment, emailAssertions } from "./test-utils";

describe("Email Implementations", () => {
  let testEnv = createEmailTestEnvironment();
  
  beforeEach(() => {
    // Reset test environment
    testEnv = createEmailTestEnvironment();
  });
  
  describe("OrderConfirmationEmail", () => {
    it("should send an order confirmation email", async () => {
      // Create order confirmation email service
      const orderConfirmationEmail = new OrderConfirmationEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send an order confirmation email
      const result = await orderConfirmationEmail.sendOrderConfirmationEmail({
        orderId: "order-123",
        orderNumber: "ORD-12345",
        orderDate: new Date(),
        customer: {
          id: "customer-123",
          email: "customer@example.com",
          name: "John Doe",
        },
        items: [
          {
            id: "item-1",
            productId: "product-1",
            name: "Performance T-Shirt",
            sku: "TS-001-M-BLK",
            variant: "Medium / Black",
            quantity: 2,
            price: 29.99,
            imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
          },
          {
            id: "item-2",
            productId: "product-2",
            name: "Running Shorts",
            sku: "RS-002-L-BLU",
            variant: "Large / Blue",
            quantity: 1,
            price: 39.99,
            imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
          },
        ],
        subtotal: 99.97,
        shipping: 5.99,
        tax: 10.60,
        total: 116.56,
        shippingAddress: {
          name: "John Doe",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA",
        },
        billingAddress: {
          name: "John Doe",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA",
        },
        paymentMethod: {
          type: "credit_card",
          last4: "1234",
          brand: "Visa",
        },
        estimatedDelivery: "July 25-27, 2025",
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("customer@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "customer@example.com");
      expect(email.subject).toContain("Order Confirmation");
    });
  });
  
  describe("ShippingNotificationEmail", () => {
    it("should send a shipping notification email", async () => {
      // Create shipping notification email service
      const shippingNotificationEmail = new ShippingNotificationEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send a shipping notification email
      const result = await shippingNotificationEmail.sendShippingNotificationEmail({
        orderId: "order-123",
        orderNumber: "ORD-12345",
        orderDate: new Date(),
        customer: {
          id: "customer-123",
          email: "customer@example.com",
          name: "John Doe",
        },
        shippedDate: new Date(),
        carrier: "FedEx",
        trackingNumber: "TRK123456789",
        trackingUrl: "https://test.godwear.com/track/TRK123456789",
        estimatedDelivery: "July 25-27, 2025",
        items: [
          {
            id: "item-1",
            productId: "product-1",
            name: "Performance T-Shirt",
            sku: "TS-001-M-BLK",
            variant: "Medium / Black",
            quantity: 2,
            imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
          },
          {
            id: "item-2",
            productId: "product-2",
            name: "Running Shorts",
            sku: "RS-002-L-BLU",
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
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("customer@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "customer@example.com");
      expect(email.subject).toContain("Shipped");
    });
  });
  
  describe("AccountSecurityEmail", () => {
    it("should send a password reset email", async () => {
      // Create account security email service
      const accountSecurityEmail = new AccountSecurityEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send a password reset email
      const result = await accountSecurityEmail.sendPasswordResetEmail({
        userId: "user-123",
        email: "user@example.com",
        name: "John Doe",
        resetToken: "abc123",
        resetUrl: "https://test.godwear.com/reset-password?token=abc123",
        expiryHours: 24,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("user@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "user@example.com");
      expect(email.subject).toContain("Reset Your Password");
    });
    
    it("should send an email verification email", async () => {
      // Create account security email service
      const accountSecurityEmail = new AccountSecurityEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send an email verification email
      const result = await accountSecurityEmail.sendEmailVerificationEmail({
        userId: "user-123",
        email: "user@example.com",
        name: "John Doe",
        verificationToken: "abc123",
        verificationUrl: "https://test.godwear.com/verify-email?token=abc123",
        expiryHours: 24,
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("user@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "user@example.com");
      expect(email.subject).toContain("Verify Your Email");
    });
  });
  
  describe("MarketingEmail", () => {
    it("should send an abandoned cart email", async () => {
      // Create marketing email service
      const marketingEmail = new MarketingEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send an abandoned cart email
      const result = await marketingEmail.sendAbandonedCartEmail({
        userId: "user-123",
        email: "user@example.com",
        name: "John Doe",
        cartId: "cart-123",
        items: [
          {
            id: "item-1",
            productId: "product-1",
            name: "Performance T-Shirt",
            sku: "TS-001-M-BLK",
            variant: "Medium / Black",
            quantity: 2,
            price: 29.99,
            imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
          },
          {
            id: "item-2",
            productId: "product-2",
            name: "Running Shorts",
            sku: "RS-002-L-BLU",
            variant: "Large / Blue",
            quantity: 1,
            price: 39.99,
            imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
          },
        ],
        cartTotal: 99.97,
        cartUrl: "https://test.godwear.com/cart",
        lastActivity: new Date(),
        discount: {
          percentage: 15,
          code: "COMEBACK15",
          expiryHours: 24,
        },
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("user@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "user@example.com");
      expect(email.subject).toContain("Save 15%");
    });
    
    it("should send an order follow-up email", async () => {
      // Create marketing email service
      const marketingEmail = new MarketingEmail(
        testEnv.emailService,
        testEnv.dependencies.env as any
      );
      
      // Send an order follow-up email
      const result = await marketingEmail.sendOrderFollowupEmail({
        userId: "user-123",
        email: "user@example.com",
        name: "John Doe",
        orderId: "order-123",
        orderNumber: "ORD-12345",
        orderDate: new Date(),
        deliveryDate: new Date(),
        items: [
          {
            id: "item-1",
            productId: "product-1",
            name: "Performance T-Shirt",
            sku: "TS-001-M-BLK",
            variant: "Medium / Black",
            quantity: 2,
            price: 29.99,
            imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
          },
          {
            id: "item-2",
            productId: "product-2",
            name: "Running Shorts",
            sku: "RS-002-L-BLU",
            variant: "Large / Blue",
            quantity: 1,
            price: 39.99,
            imageUrl: "https://test.godwear.com/images/products/rs-002-blue.jpg",
          },
        ],
        orderTotal: 99.97,
        orderUrl: "https://test.godwear.com/orders/ORD-12345",
        reviewUrl: "https://test.godwear.com/orders/ORD-12345/review",
        discount: {
          percentage: 10,
          code: "THANKS10",
          expiryHours: 168,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      
      // Check the result
      expect(result.success).toBe(true);
      expect(result.recipient).toBe("user@example.com");
      
      // Check that the email was captured
      expect(testEnv.capturedEmails.length).toBe(1);
      
      // Use email assertions
      const email = emailAssertions.emailWasSentTo(testEnv.capturedEmails, "user@example.com");
      expect(email.subject).toContain("10% off");
    });
  });
});
