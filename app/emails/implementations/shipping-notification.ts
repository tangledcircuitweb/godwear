import { z } from "zod";
import type { EmailResult } from "../services/email-service";
import type { TransactionalEmailService } from "../services/transactional-email-service";
import { addTrackingData } from "../utils/tracking";
import type { CloudflareBindings } from "../../lib/zod-utils";
import { OrderItemSchema, AddressSchema } from "./order-confirmation";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Carrier information schema
 */
const CarrierInfoSchema = z.object({
  name: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string().url(),
  estimatedDelivery: z.union([z.string(), z.date()], {}),
  serviceLevel: z.string().optional(),
  packageCount: z.number().int().positive().optional(),
});

/**
 * Shipping notification request schema
 */
const ShippingNotificationRequestSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  orderDate: z.union([z.string(), z.date()], {}),
  customerId: z.string(),
  customerEmail: z.string().email({}),
  customerName: z.string().optional(),
  carrier: CarrierInfoSchema,
  items: z.array(OrderItemSchema),
  shippingAddress: AddressSchema,
  deliveryInstructions: z.string().optional(),
  isPartialShipment: z.boolean().optional(),
  remainingItems: z.array(OrderItemSchema).optional(),
});

/**
 * Delivery update request schema
 */
const DeliveryUpdateRequestSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerEmail: z.string().email({}),
  customerName: z.string().optional(),
  carrier: CarrierInfoSchema,
  status: z.enum(["out_for_delivery", "delivered", "delayed", "exception"], {}),
  statusDetails: z.string().optional(),
  updatedDeliveryDate: z.union([z.string(), z.date()], {}).optional(),
  deliveryLocation: z.string().optional(),
  deliveryTime: z.string().optional(),
  proofOfDelivery: z.string().url().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type CarrierInfo = z.infer<typeof CarrierInfoSchema>;
export type ShippingNotificationRequest = z.infer<typeof ShippingNotificationRequestSchema>;
export type DeliveryUpdateRequest = z.infer<typeof DeliveryUpdateRequestSchema>;

/**
 * Shipping notification email service
 */
export class ShippingNotificationEmail {
  private emailService: TransactionalEmailService;
  private env: CloudflareBindings;
  private baseUrl: string;
  private logoUrl: string;
  private shippingImageUrl: string;

  /**
   * Create a new shipping notification email service
   */
  constructor(emailService: TransactionalEmailService, env: CloudflareBindings) {
    this.emailService = emailService;
    this.env = env;
    
    // Set up base URLs
    this.baseUrl = env.BASE_URL || "https://godwear.com";
    this.logoUrl = env.LOGO_URL || `${this.baseUrl}/images/logo.png`;
    this.shippingImageUrl = env.SHIPPING_IMAGE_URL || `${this.baseUrl}/images/email/shipping.png`;
  }

  /**
   * Send a shipping notification email
   */
  async sendShippingNotificationEmail(request: ShippingNotificationRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = ShippingNotificationRequestSchema.parse(request);
      
      // Format order date
      const orderDate = this.formatDate(validatedRequest.orderDate);
      
      // Format estimated delivery date
      const estimatedDelivery = this.formatDate(validatedRequest.carrier.estimatedDelivery);
      
      // Generate order URL
      const orderUrl = `${this.baseUrl}/orders/${validatedRequest.orderNumber}`;
      
      // Prepare items with image URLs
      const items = validatedRequest.items.map(item => ({
        ...item,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Send email using the transactional email service
      return this.emailService.sendShippingNotificationEmail({
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
          userId: validatedRequest.customerId,
        },
        firstName: validatedRequest.customerName?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        carrier: validatedRequest.carrier.name,
        trackingNumber: validatedRequest.carrier.trackingNumber,
        trackingUrl: validatedRequest.carrier.trackingUrl,
        estimatedDelivery,
        shippingAddress: validatedRequest.shippingAddress,
        items,
        deliveryInstructions: validatedRequest.deliveryInstructions,
        orderUrl,
        logoUrl: this.logoUrl,
        shippingImageUrl: this.shippingImageUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "shipping-notification",
      });
    } catch (error) {
      console.error("Failed to send shipping notification email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "shipping-notification",
        recipient: request.customerEmail,
        subject: `Your Order #${request.orderNumber} Has Shipped!`,
      };
    }
  }

  /**
   * Send a partial shipment notification email
   */
  async sendPartialShipmentEmail(request: ShippingNotificationRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = ShippingNotificationRequestSchema.parse(request);
      
      // Ensure this is a partial shipment
      if (!validatedRequest.isPartialShipment || !validatedRequest.remainingItems?.length) {
        throw new Error("Partial shipment requires isPartialShipment flag and remainingItems");
      }
      
      // Format order date
      const orderDate = this.formatDate(validatedRequest.orderDate);
      
      // Format estimated delivery date
      const estimatedDelivery = this.formatDate(validatedRequest.carrier.estimatedDelivery);
      
      // Generate order URL
      const orderUrl = `${this.baseUrl}/orders/${validatedRequest.orderNumber}`;
      
      // Prepare shipped items with image URLs
      const shippedItems = validatedRequest.items.map(item => ({
        ...item,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Prepare remaining items with image URLs
      const remainingItems = validatedRequest.remainingItems.map(item => ({
        ...item,
        imageUrl: item.imageUrl || `${this.baseUrl}/images/products/${item.productId}.jpg`,
      }));
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
          userId: validatedRequest.customerId,
        },
        firstName: validatedRequest.customerName?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        orderDate,
        carrier: validatedRequest.carrier.name,
        trackingNumber: validatedRequest.carrier.trackingNumber,
        trackingUrl: validatedRequest.carrier.trackingUrl,
        estimatedDelivery,
        shippingAddress: validatedRequest.shippingAddress,
        shippedItems,
        remainingItems,
        deliveryInstructions: validatedRequest.deliveryInstructions,
        orderUrl,
        logoUrl: this.logoUrl,
        shippingImageUrl: this.shippingImageUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "partial-shipment",
        isPartialShipment: true,
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.customerId,
        "orders/partial-shipment",
        "partial-shipment"
      );
      
      // Send email using raw templated email to use a different template
      return this.emailService.sendTemplatedEmail({
        templateName: "orders/partial-shipment",
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
        },
        subject: `Part of Your Order #${validatedRequest.orderNumber} Has Shipped!`,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send partial shipment email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "partial-shipment",
        recipient: request.customerEmail,
        subject: `Part of Your Order #${request.orderNumber} Has Shipped!`,
      };
    }
  }

  /**
   * Send a delivery update email
   */
  async sendDeliveryUpdateEmail(request: DeliveryUpdateRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = DeliveryUpdateRequestSchema.parse(request);
      
      // Format estimated delivery date if provided
      const updatedDeliveryDate = validatedRequest.updatedDeliveryDate 
        ? this.formatDate(validatedRequest.updatedDeliveryDate)
        : undefined;
      
      // Generate order URL
      const orderUrl = `${this.baseUrl}/orders/${validatedRequest.orderNumber}`;
      
      // Generate status message
      const statusMessage = this.getStatusMessage(validatedRequest.status, validatedRequest.statusDetails);
      
      // Generate subject line
      const subject = this.getDeliverySubject(validatedRequest.status, validatedRequest.orderNumber);
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
          userId: validatedRequest.customerId,
        },
        firstName: validatedRequest.customerName?.split(" ")[0],
        orderNumber: validatedRequest.orderNumber,
        carrier: validatedRequest.carrier.name,
        trackingNumber: validatedRequest.carrier.trackingNumber,
        trackingUrl: validatedRequest.carrier.trackingUrl,
        status: validatedRequest.status,
        statusMessage,
        updatedDeliveryDate,
        deliveryLocation: validatedRequest.deliveryLocation,
        deliveryTime: validatedRequest.deliveryTime,
        proofOfDelivery: validatedRequest.proofOfDelivery,
        orderUrl,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(validatedRequest.customerEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: `delivery-${validatedRequest.status}`,
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.customerId,
        `orders/delivery-${validatedRequest.status}`,
        `delivery-${validatedRequest.status}`
      );
      
      // Send email using raw templated email
      return this.emailService.sendTemplatedEmail({
        templateName: `orders/delivery-${validatedRequest.status}`,
        recipient: {
          email: validatedRequest.customerEmail,
          name: validatedRequest.customerName,
        },
        subject,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send delivery update email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "delivery-update",
        recipient: request.customerEmail,
        subject: `Delivery Update for Order #${request.orderNumber}`,
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
   * Get status message based on delivery status
   */
  private getStatusMessage(status: string, details?: string): string {
    switch (status) {
      case "out_for_delivery":
        return "Your package is out for delivery today!";
      case "delivered":
        return "Your package has been delivered!";
      case "delayed":
        return details || "Your delivery has been delayed. We apologize for the inconvenience.";
      case "exception":
        return details || "There's an issue with your delivery. Please check the tracking information.";
      default:
        return "Your delivery status has been updated.";
    }
  }

  /**
   * Get subject line based on delivery status
   */
  private getDeliverySubject(status: string, orderNumber: string): string {
    switch (status) {
      case "out_for_delivery":
        return `Your Order #${orderNumber} Is Out For Delivery Today!`;
      case "delivered":
        return `Your Order #${orderNumber} Has Been Delivered!`;
      case "delayed":
        return `Delivery Delay: Your Order #${orderNumber}`;
      case "exception":
        return `Delivery Alert: Your Order #${orderNumber}`;
      default:
        return `Delivery Update: Your Order #${orderNumber}`;
    }
  }
}
