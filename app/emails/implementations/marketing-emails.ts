import { z } from "zod";
import type { EmailResult } from "../services/email-service";
import type { TransactionalEmailService } from "../services/transactional-email-service";
import { addTrackingData } from "../utils/tracking";
import { generatePersonalizedDiscount } from "../utils/personalization";
import type { CloudflareBindings } from "../../lib/zod-utils";
import { OrderItemSchema } from "./order-confirmation";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Product recommendation schema
 */
const ProductRecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  imageUrl: z.string().url(),
  url: z.string().url(),
  category: z.string().optional(),
  brand: z.string().optional(),
});

/**
 * User preferences schema
 */
const UserPreferencesSchema = z.object({
  categories: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

/**
 * Abandoned cart request schema
 */
const AbandonedCartRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  cartId: z.string(),
  items: z.array(OrderItemSchema),
  cartTotal: z.number().nonnegative(),
  cartUrl: z.string().url(),
  lastActivity: z.union([z.string(), z.date()], {}),
  userSegment: z.string().optional(),
  userPreferences: UserPreferencesSchema.optional(),
  purchaseHistory: z.array(z.object({
    productId: z.string(),
    purchaseDate: z.union([z.string(), z.date()], {}),
  })).optional(),
  recommendedProducts: z.array(ProductRecommendationSchema).optional(),
  discount: z.object({
    percentage: z.number().nonnegative(),
    code: z.string(),
    expiryHours: z.number().int().positive(),
  }).optional(),
});

/**
 * Order follow-up request schema
 */
const OrderFollowupRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  orderId: z.string(),
  orderNumber: z.string(),
  orderDate: z.union([z.string(), z.date()], {}),
  deliveryDate: z.union([z.string(), z.date()], {}),
  items: z.array(OrderItemSchema),
  orderTotal: z.number().nonnegative(),
  orderUrl: z.string().url(),
  reviewUrl: z.string().url(),
  userSegment: z.string().optional(),
  userPreferences: UserPreferencesSchema.optional(),
  recommendedProducts: z.array(ProductRecommendationSchema).optional(),
  discount: z.object({
    percentage: z.number().nonnegative(),
    code: z.string(),
    expiryHours: z.number().int().positive(),
    expiryDate: z.union([z.string(), z.date()], {}),
  }).optional(),
});

/**
 * Product review request schema
 */
const ProductReviewRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  orderId: z.string(),
  orderNumber: z.string(),
  orderDate: z.union([z.string(), z.date()], {}),
  product: OrderItemSchema,
  reviewUrl: z.string().url(),
  incentive: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type ProductRecommendation = z.infer<typeof ProductRecommendationSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type AbandonedCartRequest = z.infer<typeof AbandonedCartRequestSchema>;
export type OrderFollowupRequest = z.infer<typeof OrderFollowupRequestSchema>;
export type ProductReviewRequest = z.infer<typeof ProductReviewRequestSchema>;

/**
 * Marketing email service
 */
export class MarketingEmail {
  private emailService: TransactionalEmailService;
  private env: CloudflareBindings;
  private baseUrl: string;
  private logoUrl: string;

  /**
   * Create a new marketing email service
   */
  constructor(emailService: TransactionalEmailService, env: CloudflareBindings) {
    this.emailService = emailService;
    this.env = env;
    
    // Set up base URLs
    this.baseUrl = env.BASE_URL || "https://godwear.com";
    this.logoUrl = env.LOGO_URL || `${this.baseUrl}/images/logo.png`;
  }

  /**
   * Send an abandoned cart email
   */
  async sendAbandonedCartEmail(request: AbandonedCartRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = AbandonedCartRequestSchema.parse(request);
      
      // Format cart items with prices
      const items = validatedRequest.items.map(item => ({
        ...item,
        price: this.formatCurrency(item.price),
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Format cart total
      const cartTotal = this.formatCurrency(validatedRequest.cartTotal);
      
      // Generate personalized discount if not provided
      let discount: { percentage: number; code: string; expiryHours: number } | undefined;
      
      if (!validatedRequest.discount && validatedRequest.cartTotal > 0) {
        discount = generatePersonalizedDiscount(
          validatedRequest.userId,
          validatedRequest.purchaseHistory || [],
          validatedRequest.userSegment || "STANDARD",
          validatedRequest.cartTotal
        );
      } else {
        discount = validatedRequest.discount;
      }
      
      // Generate recommended products if not provided
      let recommendations = validatedRequest.recommendedProducts;
      
      if (!recommendations || recommendations.length === 0) {
        // In a real implementation, this would call a recommendation service
        // For now, we'll just use placeholder recommendations
        recommendations = [
          {
            id: "rec-1",
            name: "Performance Running Shoes",
            price: 89.99,
            imageUrl: `${this.baseUrl}/images/products/shoes-1.jpg`,
            url: `${this.baseUrl}/products/performance-running-shoes`,
            category: "Footwear",
            brand: "GodWear",
          },
          {
            id: "rec-2",
            name: "Compression Leggings",
            price: 59.99,
            imageUrl: `${this.baseUrl}/images/products/leggings-1.jpg`,
            url: `${this.baseUrl}/products/compression-leggings`,
            category: "Bottoms",
            brand: "GodWear",
          },
          {
            id: "rec-3",
            name: "Moisture-Wicking T-Shirt",
            price: 34.99,
            imageUrl: `${this.baseUrl}/images/products/shirt-1.jpg`,
            url: `${this.baseUrl}/products/moisture-wicking-tshirt`,
            category: "Tops",
            brand: "GodWear",
          },
        ];
      }
      
      // Format recommendation prices
      const formattedRecommendations = recommendations.map(rec => ({
        ...rec,
        price: this.formatCurrency(rec.price),
      }));
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        items,
        cartTotal,
        cartUrl: validatedRequest.cartUrl,
        discount: discount?.percentage,
        discountCode: discount?.code,
        expiryHours: discount?.expiryHours,
        recommendations: formattedRecommendations,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.email)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "abandoned-cart",
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "marketing/abandoned-cart",
        "abandoned-cart"
      );
      
      // Generate subject line
      const subject = discount
        ? `${validatedRequest.name?.split(" ")[0] || "Don't miss out"}, Save ${discount.percentage}% on Items in Your Cart`
        : `${validatedRequest.name?.split(" ")[0] || "Don't miss out"}, Complete Your GodWear Purchase`;
      
      // Send email using the transactional email service
      return this.emailService.sendTemplatedEmail({
        templateName: "marketing/abandoned-cart",
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send abandoned cart email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "abandoned-cart",
        recipient: request.email,
        subject: "Complete Your Purchase",
      };
    }
  }

  /**
   * Send an order follow-up email
   */
  async sendOrderFollowupEmail(request: OrderFollowupRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = OrderFollowupRequestSchema.parse(request);
      
      // Format dates
      const orderDate = this.formatDate(validatedRequest.orderDate);
      const deliveryDate = this.formatDate(validatedRequest.deliveryDate);
      
      // Format items with prices
      const items = validatedRequest.items.map(item => ({
        ...item,
        price: this.formatCurrency(item.price),
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Format order total
      const orderTotal = this.formatCurrency(validatedRequest.orderTotal);
      
      // Format recommendation prices
      const recommendations = validatedRequest.recommendedProducts?.map(rec => ({
        ...rec,
        price: this.formatCurrency(rec.price),
      })) || [];
      
      // Format discount expiry date if provided
      const discountExpiryDate = validatedRequest.discount
        ? this.formatDate(validatedRequest.discount.expiryDate)
        : undefined;
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        orderDate,
        deliveryDate,
        items,
        orderTotal,
        orderUrl: validatedRequest.orderUrl,
        reviewUrl: validatedRequest.reviewUrl,
        discount: validatedRequest.discount?.percentage,
        discountCode: validatedRequest.discount?.code,
        discountExpiryDate,
        recommendations,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.email)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "order-followup",
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "marketing/order-followup",
        "order-followup"
      );
      
      // Generate subject line
      const subject = validatedRequest.discount
        ? `How was your order? Here's ${validatedRequest.discount.percentage}% off your next purchase`
        : `How was your GodWear order? We'd love your feedback`;
      
      // Send email using the transactional email service
      return this.emailService.sendTemplatedEmail({
        templateName: "marketing/order-followup",
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send order follow-up email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "order-followup",
        recipient: request.email,
        subject: "How was your order?",
      };
    }
  }

  /**
   * Send a product review request email
   */
  async sendProductReviewRequestEmail(request: ProductReviewRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = ProductReviewRequestSchema.parse(request);
      
      // Format dates
      const orderDate = this.formatDate(validatedRequest.orderDate);
      
      // Format product with price
      const product = {
        ...validatedRequest.product,
        price: this.formatCurrency(validatedRequest.product.price),
        imageUrl: validatedRequest.product.imageUrl || `${this.baseUrl}/images/products/${validatedRequest.product.productId}.jpg`,
      };
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        orderDate,
        product,
        reviewUrl: validatedRequest.reviewUrl,
        incentive: validatedRequest.incentive,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.email)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "product-review",
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "marketing/product-review",
        "product-review"
      );
      
      // Generate subject line
      const subject = validatedRequest.incentive
        ? `Share your thoughts on your ${validatedRequest.product.name} and earn ${validatedRequest.incentive}`
        : `How do you like your ${validatedRequest.product.name}?`;
      
      // Send email using the transactional email service
      return this.emailService.sendTemplatedEmail({
        templateName: "marketing/product-review",
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send product review request email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "product-review",
        recipient: request.email,
        subject: `Review your recent purchase`,
      };
    }
  }

  /**
   * Format a date for display
   */
  private formatDate(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format currency for display
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }
}
