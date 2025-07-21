import { describe, it, expect, beforeEach } from "vitest";
import { createEmailTestEnvironment, simulateEmailEvents } from "./test-utils";
import { OrderConfirmationEmail } from "../implementations/order-confirmation";

describe("Email Analytics", () => {
  let testEnv = createEmailTestEnvironment();
  
  beforeEach(() => {
    // Reset test environment
    testEnv = createEmailTestEnvironment();
    testEnv.analyticsService.clearEvents();
  });
  
  describe("Event Tracking", () => {
    it("should track email events", async () => {
      // Create a test email ID
      const emailId = "test-email-123";
      const recipientEmail = "test@example.com";
      
      // Simulate email events
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailId,
        recipientEmail,
        ["sent", "delivered", "opened", "clicked"]
      );
      
      // Query events
      const result = await testEnv.analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000), // Last hour
        emailId,
      });
      
      // Check results
      expect(result.totalCount).toBe(4);
      expect(result.events.some(e => e.eventType === "sent")).toBe(true);
      expect(result.events.some(e => e.eventType === "delivered")).toBe(true);
      expect(result.events.some(e => e.eventType === "opened")).toBe(true);
      expect(result.events.some(e => e.eventType === "clicked")).toBe(true);
    });
    
    it("should track bounce events", async () => {
      // Create a test email ID
      const emailId = "test-email-456";
      const recipientEmail = "bounce@example.com";
      
      // Simulate email events
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailId,
        recipientEmail,
        ["sent", "bounced"]
      );
      
      // Query events
      const result = await testEnv.analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000), // Last hour
        emailId,
      });
      
      // Check results
      expect(result.totalCount).toBe(2);
      expect(result.events.some(e => e.eventType === "sent")).toBe(true);
      expect(result.events.some(e => e.eventType === "bounced")).toBe(true);
    });
  });
  
  describe("Metrics Calculation", () => {
    it("should calculate email metrics", async () => {
      // Create test email IDs
      const emailIds = [
        "test-email-1",
        "test-email-2",
        "test-email-3",
        "test-email-4",
      ];
      
      // Simulate various email events
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailIds[0],
        "user1@example.com",
        ["sent", "delivered", "opened", "clicked"]
      );
      
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailIds[1],
        "user2@example.com",
        ["sent", "delivered", "opened"]
      );
      
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailIds[2],
        "user3@example.com",
        ["sent", "delivered"]
      );
      
      await simulateEmailEvents(
        testEnv.analyticsService,
        emailIds[3],
        "user4@example.com",
        ["sent", "bounced"]
      );
      
      // Get metrics
      const metrics = await testEnv.analyticsService.getMetrics({
        startDate: new Date(Date.now() - 3600000), // Last hour
      });
      
      // Check overall metrics
      expect(metrics.overall.sent).toBe(4);
      expect(metrics.overall.delivered).toBe(3);
      expect(metrics.overall.opened).toBe(2);
      expect(metrics.overall.clicked).toBe(1);
      expect(metrics.overall.bounced).toBe(1);
      
      // Check rates
      expect(metrics.overall.deliveryRate).toBeCloseTo(0.75); // 3/4
      expect(metrics.overall.openRate).toBeCloseTo(0.6667, 2); // 2/3
      expect(metrics.overall.clickRate).toBeCloseTo(0.3333, 2); // 1/3
      expect(metrics.overall.bounceRate).toBeCloseTo(0.25); // 1/4
      expect(metrics.overall.clickToOpenRate).toBeCloseTo(0.5); // 1/2
    });
  });
  
  describe("Integration with Email Implementations", () => {
    it("should track events from sent emails", async () => {
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
          },
        ],
        subtotal: 59.98,
        shipping: 5.99,
        tax: 6.60,
        total: 72.57,
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
      
      // Check that the email was sent successfully
      expect(result.success).toBe(true);
      
      // Query events
      const events = await testEnv.analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000), // Last hour
      });
      
      // Check that a sent event was recorded
      expect(events.totalCount).toBe(1);
      expect(events.events[0].eventType).toBe("sent");
      expect(events.events[0].recipientEmail).toBe("customer@example.com");
      
      // Simulate additional events
      await simulateEmailEvents(
        testEnv.analyticsService,
        events.events[0].emailId,
        "customer@example.com",
        ["delivered", "opened"]
      );
      
      // Query events again
      const updatedEvents = await testEnv.analyticsService.queryEvents({
        startDate: new Date(Date.now() - 3600000), // Last hour
      });
      
      // Check that all events were recorded
      expect(updatedEvents.totalCount).toBe(3);
      expect(updatedEvents.events.some(e => e.eventType === "sent")).toBe(true);
      expect(updatedEvents.events.some(e => e.eventType === "delivered")).toBe(true);
      expect(updatedEvents.events.some(e => e.eventType === "opened")).toBe(true);
    });
  });
});
