import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketingEmail } from "./marketing-emails";
import type { TransactionalEmailService } from "../services/transactional-email-service";

describe("MarketingEmail", () => {
  // Mock dependencies
  const mockEmailService = {
    sendTemplatedEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "customer@example.com",
      subject: "Test Subject",
    }),
  } as unknown as TransactionalEmailService;

  const mockEnv = {
    BASE_URL: "https://test.godwear.com",
    LOGO_URL: "https://test.godwear.com/logo.png",
    SUPPORT_EMAIL: "support@test.godwear.com",
  };

  // Sample data
  const sampleAbandonedCart = {
    userId: "user-123",
    email: "customer@example.com",
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
    lastActivity: "2025-07-20T12:00:00Z",
    userSegment: "STANDARD",
  };

  const sampleOrderFollowup = {
    userId: "user-123",
    email: "customer@example.com",
    name: "John Doe",
    orderId: "order-123",
    orderNumber: "GW-12345",
    orderDate: "2025-07-15T12:00:00Z",
    deliveryDate: "2025-07-18T12:00:00Z",
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
    orderUrl: "https://test.godwear.com/orders/GW-12345",
    reviewUrl: "https://test.godwear.com/orders/GW-12345/review",
  };

  const sampleProductReview = {
    userId: "user-123",
    email: "customer@example.com",
    name: "John Doe",
    orderId: "order-123",
    orderNumber: "GW-12345",
    orderDate: "2025-07-15T12:00:00Z",
    product: {
      id: "item-1",
      productId: "product-1",
      name: "Performance T-Shirt",
      sku: "TS-001-M-BLK",
      variant: "Medium / Black",
      quantity: 2,
      price: 29.99,
      imageUrl: "https://test.godwear.com/images/products/ts-001-black.jpg",
    },
    reviewUrl: "https://test.godwear.com/products/product-1/review",
    incentive: "10% off your next purchase",
  };

  let marketingEmail: MarketingEmail;

  beforeEach(() => {
    vi.clearAllMocks();
    marketingEmail = new MarketingEmail(mockEmailService, mockEnv as any);
  });

  describe("sendAbandonedCartEmail", () => {
    it("should send an abandoned cart email successfully", async () => {
      const result = await marketingEmail.sendAbandonedCartEmail(sampleAbandonedCart);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("marketing/abandoned-cart");
      expect(callArgs.recipient.email).toBe(sampleAbandonedCart.email);
      expect(callArgs.data.items.length).toBe(sampleAbandonedCart.items.length);
      expect(callArgs.data.cartTotal).toContain("$");
      expect(callArgs.data.recommendations).toBeDefined();
      expect(callArgs.data.recommendations.length).toBeGreaterThan(0);
    });

    it("should include discount information when provided", async () => {
      const result = await marketingEmail.sendAbandonedCartEmail({
        ...sampleAbandonedCart,
        discount: {
          percentage: 15,
          code: "COMEBACK15",
          expiryHours: 24,
        },
      });

      expect(result.success).toBe(true);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.data.discount).toBe(15);
      expect(callArgs.data.discountCode).toBe("COMEBACK15");
      expect(callArgs.data.expiryHours).toBe(24);
      expect(callArgs.subject).toContain("15%");
    });

    it("should handle errors gracefully", async () => {
      mockEmailService.sendTemplatedEmail = vi.fn().mockRejectedValue(new Error("Test error"));

      const result = await marketingEmail.sendAbandonedCartEmail(sampleAbandonedCart);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
    });
  });

  describe("sendOrderFollowupEmail", () => {
    it("should send an order follow-up email successfully", async () => {
      const result = await marketingEmail.sendOrderFollowupEmail(sampleOrderFollowup);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("marketing/order-followup");
      expect(callArgs.recipient.email).toBe(sampleOrderFollowup.email);
      expect(callArgs.data.orderNumber).toBe(sampleOrderFollowup.orderNumber);
      expect(callArgs.data.items.length).toBe(sampleOrderFollowup.items.length);
      expect(callArgs.data.orderTotal).toContain("$");
      expect(callArgs.subject).toContain("feedback");
    });

    it("should include discount information when provided", async () => {
      const result = await marketingEmail.sendOrderFollowupEmail({
        ...sampleOrderFollowup,
        discount: {
          percentage: 10,
          code: "THANKS10",
          expiryHours: 168, // 7 days
          expiryDate: "2025-07-28T12:00:00Z",
        },
      });

      expect(result.success).toBe(true);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.data.discount).toBe(10);
      expect(callArgs.data.discountCode).toBe("THANKS10");
      expect(callArgs.data.discountExpiryDate).toBeDefined();
      expect(callArgs.subject).toContain("10%");
    });
  });

  describe("sendProductReviewRequestEmail", () => {
    it("should send a product review request email successfully", async () => {
      const result = await marketingEmail.sendProductReviewRequestEmail(sampleProductReview);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("marketing/product-review");
      expect(callArgs.recipient.email).toBe(sampleProductReview.email);
      expect(callArgs.data.product.name).toBe(sampleProductReview.product.name);
      expect(callArgs.data.reviewUrl).toBe(sampleProductReview.reviewUrl);
      expect(callArgs.data.incentive).toBe(sampleProductReview.incentive);
      expect(callArgs.subject).toContain(sampleProductReview.product.name);
      expect(callArgs.subject).toContain(sampleProductReview.incentive);
    });

    it("should handle product review request without incentive", async () => {
      const result = await marketingEmail.sendProductReviewRequestEmail({
        ...sampleProductReview,
        incentive: undefined,
      });

      expect(result.success).toBe(true);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.data.incentive).toBeUndefined();
      expect(callArgs.subject).toContain("How do you like");
      expect(callArgs.subject).not.toContain("earn");
    });
  });
});
