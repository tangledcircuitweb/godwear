import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderConfirmationEmail } from "./order-confirmation";
import type { TransactionalEmailService } from "../services/transactional-email-service";

describe("OrderConfirmationEmail", () => {
  // Mock dependencies
  const mockEmailService = {
    sendOrderConfirmationEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "customer@example.com",
      subject: "Order Confirmation",
    }),
    sendTemplatedEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "customer@example.com",
      subject: "Order Confirmation",
    }),
  } as unknown as TransactionalEmailService;

  const mockEnv = {
    BASE_URL: "https://test.godwear.com",
    LOGO_URL: "https://test.godwear.com/logo.png",
    SUPPORT_EMAIL: "support@test.godwear.com",
  };

  // Sample order data
  const sampleOrder = {
    orderId: "order-123",
    orderNumber: "GW-12345",
    orderDate: "2025-07-20T12:00:00Z",
    customerId: "customer-123",
    customerEmail: "customer@example.com",
    customerName: "John Doe",
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
    tax: 8.50,
    total: 114.46,
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
    billingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
    shippingMethod: "Standard Shipping (3-5 days)",
    estimatedDelivery: "2025-07-25T12:00:00Z",
    paymentDetails: {
      method: "Credit Card",
      cardBrand: "Visa",
      cardLast4: "1234",
      transactionId: "txn-123456",
    },
  };

  let orderConfirmationEmail: OrderConfirmationEmail;

  beforeEach(() => {
    vi.clearAllMocks();
    orderConfirmationEmail = new OrderConfirmationEmail(mockEmailService, mockEnv as any);
  });

  describe("sendOrderConfirmationEmail", () => {
    it("should send an order confirmation email successfully", async () => {
      const result = await orderConfirmationEmail.sendOrderConfirmationEmail(sampleOrder);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendOrderConfirmationEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendOrderConfirmationEmail.mock.calls[0][0];
      expect(callArgs.recipient.email).toBe(sampleOrder.customerEmail);
      expect(callArgs.recipient.name).toBe(sampleOrder.customerName);
      expect(callArgs.orderNumber).toBe(sampleOrder.orderNumber);
      expect(callArgs.items.length).toBe(sampleOrder.items.length);
    });

    it("should handle errors gracefully", async () => {
      mockEmailService.sendOrderConfirmationEmail = vi.fn().mockRejectedValue(new Error("Test error"));

      const result = await orderConfirmationEmail.sendOrderConfirmationEmail(sampleOrder);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
    });
  });

  describe("sendGiftOrderConfirmationEmail", () => {
    it("should send a gift order confirmation email successfully", async () => {
      const giftOrder = {
        ...sampleOrder,
        giftMessage: "Happy Birthday! Enjoy your new workout gear!",
      };

      const result = await orderConfirmationEmail.sendGiftOrderConfirmationEmail(giftOrder);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("orders/gift-order-confirmation");
      expect(callArgs.recipient.email).toBe(giftOrder.customerEmail);
      expect(callArgs.data.giftMessage).toBe(giftOrder.giftMessage);
    });

    it("should require a gift message", async () => {
      const result = await orderConfirmationEmail.sendGiftOrderConfirmationEmail(sampleOrder);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gift message is required");
    });
  });

  describe("sendOrderCancellationEmail", () => {
    it("should send an order cancellation email successfully", async () => {
      const cancellationRequest = {
        ...sampleOrder,
        cancellationReason: "Out of stock",
        refundAmount: 114.46,
        refundMethod: "Original payment method",
      };

      const result = await orderConfirmationEmail.sendOrderCancellationEmail(cancellationRequest);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("orders/order-cancellation");
      expect(callArgs.subject).toContain("Cancelled");
      expect(callArgs.data.cancellationReason).toBe(cancellationRequest.cancellationReason);
    });
  });
});
