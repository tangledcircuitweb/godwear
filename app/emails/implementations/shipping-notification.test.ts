import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShippingNotificationEmail } from "./shipping-notification";
import type { TransactionalEmailService } from "../services/transactional-email-service";

describe("ShippingNotificationEmail", () => {
  // Mock dependencies
  const mockEmailService = {
    sendShippingNotificationEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "customer@example.com",
      subject: "Your Order Has Shipped",
    }),
    sendTemplatedEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "customer@example.com",
      subject: "Your Order Has Shipped",
    }),
  } as unknown as TransactionalEmailService;

  const mockEnv = {
    BASE_URL: "https://test.godwear.com",
    LOGO_URL: "https://test.godwear.com/logo.png",
    SHIPPING_IMAGE_URL: "https://test.godwear.com/images/shipping.png",
    SUPPORT_EMAIL: "support@test.godwear.com",
  };

  // Sample shipping data
  const sampleShipping = {
    orderId: "order-123",
    orderNumber: "GW-12345",
    orderDate: "2025-07-20T12:00:00Z",
    customerId: "customer-123",
    customerEmail: "customer@example.com",
    customerName: "John Doe",
    carrier: {
      name: "FedEx",
      trackingNumber: "FEDEX123456789",
      trackingUrl: "https://test.fedex.com/track/FEDEX123456789",
      estimatedDelivery: "2025-07-25T12:00:00Z",
      serviceLevel: "Ground",
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
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
    deliveryInstructions: "Leave at front door",
  };

  // Sample partial shipping data
  const samplePartialShipping = {
    ...sampleShipping,
    isPartialShipment: true,
    remainingItems: [
      {
        id: "item-3",
        productId: "product-3",
        name: "Workout Hoodie",
        sku: "WH-003-L-GRY",
        variant: "Large / Gray",
        quantity: 1,
        price: 49.99,
        imageUrl: "https://test.godwear.com/images/products/wh-003-gray.jpg",
      },
    ],
  };

  // Sample delivery update data
  const sampleDeliveryUpdate = {
    orderId: "order-123",
    orderNumber: "GW-12345",
    customerId: "customer-123",
    customerEmail: "customer@example.com",
    customerName: "John Doe",
    carrier: {
      name: "FedEx",
      trackingNumber: "FEDEX123456789",
      trackingUrl: "https://test.fedex.com/track/FEDEX123456789",
      estimatedDelivery: "2025-07-25T12:00:00Z",
      serviceLevel: "Ground",
    },
    status: "out_for_delivery",
    statusDetails: "Your package is scheduled for delivery today before 8:00 PM",
  };

  let shippingNotificationEmail: ShippingNotificationEmail;

  beforeEach(() => {
    vi.clearAllMocks();
    shippingNotificationEmail = new ShippingNotificationEmail(mockEmailService, mockEnv as any);
  });

  describe("sendShippingNotificationEmail", () => {
    it("should send a shipping notification email successfully", async () => {
      const result = await shippingNotificationEmail.sendShippingNotificationEmail(sampleShipping);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendShippingNotificationEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendShippingNotificationEmail.mock.calls[0][0];
      expect(callArgs.recipient.email).toBe(sampleShipping.customerEmail);
      expect(callArgs.recipient.name).toBe(sampleShipping.customerName);
      expect(callArgs.orderNumber).toBe(sampleShipping.orderNumber);
      expect(callArgs.carrier).toBe(sampleShipping.carrier.name);
      expect(callArgs.trackingNumber).toBe(sampleShipping.carrier.trackingNumber);
      expect(callArgs.trackingUrl).toBe(sampleShipping.carrier.trackingUrl);
      expect(callArgs.items.length).toBe(sampleShipping.items.length);
      expect(callArgs.deliveryInstructions).toBe(sampleShipping.deliveryInstructions);
    });

    it("should handle errors gracefully", async () => {
      mockEmailService.sendShippingNotificationEmail = vi.fn().mockRejectedValue(new Error("Test error"));

      const result = await shippingNotificationEmail.sendShippingNotificationEmail(sampleShipping);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
    });
  });

  describe("sendPartialShipmentEmail", () => {
    it("should send a partial shipment email successfully", async () => {
      const result = await shippingNotificationEmail.sendPartialShipmentEmail(samplePartialShipping);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("orders/partial-shipment");
      expect(callArgs.recipient.email).toBe(samplePartialShipping.customerEmail);
      expect(callArgs.data.shippedItems.length).toBe(samplePartialShipping.items.length);
      expect(callArgs.data.remainingItems.length).toBe(samplePartialShipping.remainingItems.length);
      expect(callArgs.data.isPartialShipment).toBe(true);
    });

    it("should require isPartialShipment flag and remainingItems", async () => {
      const result = await shippingNotificationEmail.sendPartialShipmentEmail({
        ...sampleShipping,
        isPartialShipment: true, // Missing remainingItems
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Partial shipment requires");
    });
  });

  describe("sendDeliveryUpdateEmail", () => {
    it("should send a delivery update email successfully", async () => {
      const result = await shippingNotificationEmail.sendDeliveryUpdateEmail(sampleDeliveryUpdate);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("orders/delivery-out_for_delivery");
      expect(callArgs.recipient.email).toBe(sampleDeliveryUpdate.customerEmail);
      expect(callArgs.data.status).toBe(sampleDeliveryUpdate.status);
      expect(callArgs.data.statusMessage).toContain("out for delivery");
    });

    it("should handle different delivery statuses", async () => {
      const deliveredUpdate = {
        ...sampleDeliveryUpdate,
        status: "delivered",
        deliveryLocation: "Front Door",
        deliveryTime: "2:30 PM",
        proofOfDelivery: "https://test.fedex.com/pod/FEDEX123456789",
      };

      const result = await shippingNotificationEmail.sendDeliveryUpdateEmail(deliveredUpdate);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("orders/delivery-delivered");
      expect(callArgs.subject).toContain("Has Been Delivered");
      expect(callArgs.data.deliveryLocation).toBe(deliveredUpdate.deliveryLocation);
      expect(callArgs.data.deliveryTime).toBe(deliveredUpdate.deliveryTime);
      expect(callArgs.data.proofOfDelivery).toBe(deliveredUpdate.proofOfDelivery);
    });
  });
});
