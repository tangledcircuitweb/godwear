import { z } from "zod";
import type { EmailResult } from "../services/email-service";
import type { TransactionalEmailService } from "../services/transactional-email-service";
import { addTrackingData } from "../utils/tracking";
import type { CloudflareBindings } from "../../lib/zod-utils";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Order item schema
 */
export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  variant: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
});

/**
 * Address schema
 */
export const AddressSchema = z.object({
  name: z.string(),
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

/**
 * Payment details schema
 */
const PaymentDetailsSchema = z.object({
  method: z.string(),
  cardBrand: z.string().optional(),
  cardLast4: z.string().optional(),
  transactionId: z.string().optional(),
});

/**
 * Order confirmation request schema
 */
const OrderConfirmationRequestSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  orderDate: z.union([z.string(), z.date()], {}),
  customerId: z.string(),
  customerEmail: z.string().email({}),
  customerName: z.string().optional(),
  items: z.array(OrderItemSchema),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  shippingMethod: z.string(),
  estimatedDelivery: z.union([z.string(), z.date()], {}),
  paymentDetails: PaymentDetailsSchema,
  notes: z.string().optional(),
  giftMessage: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type PaymentDetails = z.infer<typeof PaymentDetailsSchema>;
export type OrderConfirmationRequest = z.infer<typeof OrderConfirmationRequestSchema>;

/**
 * Order confirmation email service
 */
export class OrderConfirmationEmail {
  private emailService: TransactionalEmailService;
  private env: CloudflareBindings;
  private baseUrl: string;
  private logoUrl: string;

  /**
   * Create a new order confirmation email service
   */
  constructor(emailService: TransactionalEmailService, env: CloudflareBindings) {
    this.emailService = emailService;
    this.env = env;
    
    // Set up base URLs
    this.baseUrl = env.BASE_URL || "https://godwear.com";
    this.logoUrl = env.LOGO_URL || `${this.baseUrl}/images/logo.png`;
  }

  /**
   * Send an order confirmation email
   */
  async sendOrderConfirmationEmail(request: OrderConfirmationRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = OrderConfirmationRequestSchema.parse(request);
      
      // Format order date
      const orderDate = this.formatDate(validatedRequest.orderDate);
      
      // Format estimated delivery date
      const estimatedDelivery = this.formatDate(validatedRequest.estimatedDelivery);
      
      // Generate tracking URL
      const trackOrderUrl = `${this.baseUrl}/orders/${validatedRequest.orderNumber}`;
      
      // Generate returns URL
      const returnsUrl = `${this.baseUrl}/returns`;
      
      // Format payment method
      const paymentMethod = this.formatPaymentMethod(validatedRequest.paymentDetails);
      
      // Prepare items with image URLs and ensure required properties
      const items = validatedRequest.items.map(item => ({
        name: item.name,
        variant: item.variant || "Standard", // Provide default for required field
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Send email using the transactional email service
      return this.emailService.sendOrderConfirmationEmail({
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
          userId: validatedRequest.customerId,
        },
        firstName: validatedRequest.customerName?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        orderDate,
        paymentMethod,
        shippingMethod: validatedRequest.shippingMethod,
        items,
        subtotal: validatedRequest.subtotal,
        shipping: validatedRequest.shipping,
        tax: validatedRequest.tax,
        discount: validatedRequest.discount,
        total: validatedRequest.total,
        shippingAddress: validatedRequest.shippingAddress,
        billingAddress: validatedRequest.billingAddress,
        estimatedDelivery,
        trackOrderUrl,
        returnsUrl,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "order-confirmation",
      });
    } catch (error) {
      console.error("Failed to send order confirmation email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "order-confirmation",
        recipient: request.customerEmail,
        subject: `Order Confirmation: #${request.orderNumber}`,
      };
    }
  }

  /**
   * Send a gift order confirmation email
   */
  async sendGiftOrderConfirmationEmail(request: OrderConfirmationRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = OrderConfirmationRequestSchema.parse(request);
      
      // Ensure gift message is present
      if (!validatedRequest.giftMessage) {
        throw new Error("Gift message is required for gift order confirmation");
      }
      
      // Format order date
      const orderDate = this.formatDate(validatedRequest.orderDate);
      
      // Format estimated delivery date
      const estimatedDelivery = this.formatDate(validatedRequest.estimatedDelivery);
      
      // Generate tracking URL
      const trackOrderUrl = `${this.baseUrl}/orders/${validatedRequest.orderNumber}`;
      
      // Generate returns URL
      const returnsUrl = `${this.baseUrl}/returns`;
      
      // Format payment method
      const paymentMethod = this.formatPaymentMethod(validatedRequest.paymentDetails);
      
      // Prepare items with image URLs and ensure required properties
      const items = validatedRequest.items.map(item => ({
        name: item.name,
        variant: item.variant || "Standard", // Provide default for required field
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Add gift message to template data
      const templateData = {
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
          userId: validatedRequest.customerId,
        },
        firstName: validatedRequest.customerName?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        orderDate,
        paymentMethod,
        shippingMethod: validatedRequest.shippingMethod,
        items,
        subtotal: validatedRequest.subtotal,
        shipping: validatedRequest.shipping,
        tax: validatedRequest.tax,
        discount: validatedRequest.discount,
        total: validatedRequest.total,
        shippingAddress: validatedRequest.shippingAddress,
        billingAddress: validatedRequest.billingAddress,
        estimatedDelivery,
        trackOrderUrl,
        returnsUrl,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "gift-order-confirmation",
        giftMessage: validatedRequest.giftMessage,
        isGift: true,
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.customerId,
        "orders/gift-order-confirmation",
        "gift-order-confirmation"
      );
      
      // Send email using raw templated email to use a different template
      return this.emailService.sendTemplatedEmail({
        templateName: "orders/gift-order-confirmation",
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
        },
        subject: `Gift Order Confirmation: #${validatedRequest.orderNumber}`,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send gift order confirmation email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "gift-order-confirmation",
        recipient: request.customerEmail,
        subject: `Gift Order Confirmation: #${request.orderNumber}`,
      };
    }
  }

  /**
   * Send an order cancellation email
   */
  async sendOrderCancellationEmail(
    request: Omit<OrderConfirmationRequest, "estimatedDelivery"> & { 
      cancellationReason: string;
      refundAmount?: number;
      refundMethod?: string;
    }
  ): Promise<EmailResult> {
    try {
      // Validate base request
      const validatedBase = OrderConfirmationRequestSchema.omit({ 
        estimatedDelivery: true 
      }).extend({
        cancellationReason: z.string(),
        refundAmount: z.number().nonnegative().optional(),
        refundMethod: z.string().optional(),
      }).parse(request);
      
      // Format order date
      const orderDate = this.formatDate(validatedBase.orderDate);
      
      // Generate order URL
      const orderUrl = `${this.baseUrl}/orders/${validatedBase.orderNumber}`;
      
      // Format payment method
      const paymentMethod = this.formatPaymentMethod(validatedBase.paymentDetails);
      
      // Prepare items with image URLs and ensure required properties
      const items = validatedBase.items.map(item => ({
        name: item.name,
        variant: item.variant || "Standard", // Provide default for required field
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Prepare refund information
      const refundInfo = validatedBase.refundAmount ? {
        amount: validatedBase.refundAmount,
        method: validatedBase.refundMethod || paymentMethod,
        formattedAmount: this.formatCurrency(validatedBase.refundAmount),
      } : undefined;
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedBase.customerEmail,
          name: validatedBase.customerName,
          userId: validatedBase.customerId,
        },
        firstName: validatedBase.customerName?.split(" ")[0],
        orderNumber: validatedBase.orderNumber,
        orderDate,
        paymentMethod,
        items,
        subtotal: validatedBase.subtotal,
        shipping: validatedBase.shipping,
        tax: validatedBase.tax,
        discount: validatedBase.discount,
        total: validatedBase.total,
        cancellationReason: validatedBase.cancellationReason,
        refund: refundInfo,
        orderUrl,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedBase.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "order-cancellation",
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedBase.customerId,
        "orders/order-cancellation",
        "order-cancellation"
      );
      
      // Send email using raw templated email
      return this.emailService.sendTemplatedEmail({
        templateName: "orders/order-cancellation",
        recipient: {
          email: validatedBase.customerEmail,
          name: validatedBase.customerName,
        },
        subject: `Order Cancelled: #${validatedBase.orderNumber}`,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send order cancellation email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "order-cancellation",
        recipient: request.customerEmail,
        subject: `Order Cancelled: #${request.orderNumber}`,
      };
    }
  }

  /**
   * Format a date for display
   */
  private formatDate(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(paymentDetails: PaymentDetails): string {
    if (paymentDetails.cardBrand && paymentDetails.cardLast4) {
      return `${paymentDetails.cardBrand} ending in ${paymentDetails.cardLast4}`;
    }
    
    return paymentDetails.method;
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
