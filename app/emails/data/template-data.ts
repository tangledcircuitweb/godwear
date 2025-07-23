import { z } from "zod";

// ============================================================================
// EMAIL TEMPLATE DATA SCHEMAS - COMPLETE COVERAGE
// ============================================================================

/**
 * Common variables used across all email templates
 */
const CommonTemplateDataSchema = z.object({
  name: z.string(),
  firstName: z.string(),
  logoUrl: z.string().url(),
  supportEmail: z.string().email({}),
  supportUrl: z.string().url(),
  currentYear: z.number(),
  unsubscribeUrl: z.string().url(),
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
  shopUrl: z.string().url().optional(),
  preheader: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
});

/**
 * Address schema for shipping and billing
 */
const AddressSchema = z.object({
  name: z.string(),
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

/**
 * Order item schema
 */
const OrderItemSchema = z.object({
  name: z.string(),
  imageUrl: z.string().url(),
  variant: z.string(),
  sku: z.string(),
  quantity: z.number(),
  price: z.string(),
});

/**
 * Product schema for recommendations
 */
const ProductSchema = z.object({
  name: z.string(),
  imageUrl: z.string().url(),
  price: z.string(),
  variant: z.string().optional(),
});

/**
 * Cart item schema
 */
const CartItemSchema = z.object({
  name: z.string(),
  imageUrl: z.string().url(),
  price: z.string(),
  quantity: z.number(),
  variant: z.string().optional(),
});

/**
 * Refund schema
 */
const RefundSchema = z.object({
  formattedAmount: z.string(),
  method: z.string(),
});

/**
 * Order-specific template data - COMPLETE
 */
const OrderTemplateDataSchema = CommonTemplateDataSchema.extend({
  orderNumber: z.string(),
  orderDate: z.string(),
  orderUrl: z.string().url(),
  paymentMethod: z.string(),
  shippingMethod: z.string(),
  items: z.array(OrderItemSchema),
  shippedItems: z.array(OrderItemSchema).optional(),
  remainingItems: z.array(OrderItemSchema).optional(),
  subtotal: z.string(),
  shipping: z.string(),
  tax: z.string(),
  discount: z.string().optional(),
  discountCode: z.string().optional(),
  total: z.string(),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  estimatedDelivery: z.string(),
  expectedDelivery: z.string().optional(),
  deliveryDate: z.string().optional(),
  updatedDeliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  deliveryLocation: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  trackOrderUrl: z.string().url(),
  trackingUrl: z.string().url().optional(),
  trackingNumber: z.string().optional(),
  returnsUrl: z.string().url(),
  carrier: z.string().optional(),
  shipDate: z.string().optional(),
  shippedDate: z.string().optional(),
  shippingImageUrl: z.string().url().optional(),
  statusMessage: z.string().optional(),
  cancellationReason: z.string().optional(),
  refund: RefundSchema.optional(),
  giftMessage: z.string().optional(),
  proofOfDelivery: z.string().optional(),
  isPartialShipment: z.boolean().optional(),
});

/**
 * Account-specific template data - COMPLETE
 */
const AccountTemplateDataSchema = CommonTemplateDataSchema.extend({
  resetUrl: z.string().url().optional(),
  verificationUrl: z.string().url().optional(),
  accountSettingsUrl: z.string().url().optional(),
  ipAddress: z.string().optional(),
  device: z.string().optional(),
  timestamp: z.string().optional(),
  expiresAt: z.string().optional(),
  expiresInMinutes: z.number().optional(),
  expiryTime: z.string().optional(),
  expiryHours: z.number().optional(),
  updateDetails: z.string().optional(),
  updateTypeDisplay: z.string().optional(),
  isNewUser: z.boolean().optional(),
});

/**
 * Marketing-specific template data - COMPLETE
 */
const MarketingTemplateDataSchema = CommonTemplateDataSchema.extend({
  productName: z.string().optional(),
  productUrl: z.string().url().optional(),
  reviewUrl: z.string().url().optional(),
  discountCode: z.string().optional(),
  discountAmount: z.string().optional(),
  discountExpiryDate: z.string().optional(),
  cartItems: z.array(CartItemSchema).optional(),
  cartTotal: z.string().optional(),
  cartUrl: z.string().url().optional(),
  recommendations: z.array(ProductSchema).optional(),
  incentive: z.string().optional(),
  url: z.string().url().optional(),
});

// ============================================================================
// MOCK DATA GENERATORS - COMPLETE COVERAGE
// ============================================================================

/**
 * Generate common template data with Christian branding
 */
export function generateCommonTemplateData(): z.infer<typeof CommonTemplateDataSchema> {
  return {
    name: "Sarah Grace",
    firstName: "Sarah",
    logoUrl: "https://godwear.com/assets/logo-white.png",
    supportEmail: "blessings@godwear.com",
    supportUrl: "https://godwear.com/support",
    currentYear: new Date().getFullYear(),
    unsubscribeUrl: "https://godwear.com/unsubscribe",
    privacyUrl: "https://godwear.com/privacy",
    termsUrl: "https://godwear.com/terms",
    shopUrl: "https://godwear.com/shop",
    preheader: "GodWear - Where Faith Meets Fashion",
    title: "GodWear Email",
    content: "Christian-themed email content",
  };
}

/**
 * Generate realistic Christian-themed order items
 */
function generateOrderItems(): z.infer<typeof OrderItemSchema>[] {
  return [
    {
      name: "Faith Over Fear T-Shirt",
      imageUrl: "https://godwear.com/products/faith-over-fear-tee.jpg",
      variant: "Navy Blue, Size L",
      sku: "FOF-TEE-NVY-L",
      quantity: 2,
      price: "$29.99",
    },
    {
      name: "Blessed & Grateful Hoodie",
      imageUrl: "https://godwear.com/products/blessed-grateful-hoodie.jpg",
      variant: "Heather Gray, Size M",
      sku: "BG-HOOD-HGR-M",
      quantity: 1,
      price: "$49.99",
    },
    {
      name: "Proverbs 31 Woman Mug",
      imageUrl: "https://godwear.com/products/proverbs-31-mug.jpg",
      variant: "White Ceramic, 11oz",
      sku: "P31-MUG-WHT-11",
      quantity: 1,
      price: "$19.99",
    },
  ];
}

/**
 * Generate cart items for abandoned cart emails
 */
function generateCartItems(): z.infer<typeof CartItemSchema>[] {
  return [
    {
      name: "Jesus Loves You Keychain",
      imageUrl: "https://godwear.com/products/jesus-loves-keychain.jpg",
      price: "$12.99",
      quantity: 1,
      variant: "Silver",
    },
    {
      name: "Scripture Memory Cards Set",
      imageUrl: "https://godwear.com/products/scripture-cards.jpg",
      price: "$24.99",
      quantity: 1,
      variant: "Set of 50",
    },
  ];
}

/**
 * Generate product recommendations
 */
function generateRecommendations(): z.infer<typeof ProductSchema>[] {
  return [
    {
      name: "Walk by Faith Bracelet",
      imageUrl: "https://godwear.com/products/walk-by-faith-bracelet.jpg",
      price: "$34.99",
      variant: "Rose Gold",
    },
    {
      name: "His Grace is Sufficient Journal",
      imageUrl: "https://godwear.com/products/grace-journal.jpg",
      price: "$22.99",
    },
    {
      name: "Armor of God Wall Art",
      imageUrl: "https://godwear.com/products/armor-of-god-art.jpg",
      price: "$45.99",
      variant: "16x20 Canvas",
    },
  ];
}

/**
 * Generate realistic address data
 */
function generateAddress(name: string): z.infer<typeof AddressSchema> {
  return {
    name,
    street: "123 Blessing Boulevard",
    street2: "Apt 7B",
    city: "Grace Valley",
    state: "TX",
    zip: "75001",
    country: "United States",
  };
}

/**
 * Generate order template data - COMPLETE
 */
export function generateOrderTemplateData(): z.infer<typeof OrderTemplateDataSchema> {
  const common = generateCommonTemplateData();
  const items = generateOrderItems();
  
  return {
    ...common,
    orderNumber: "GW-2024-001234",
    orderDate: "January 15, 2024",
    orderUrl: "https://godwear.com/orders/GW-2024-001234",
    paymentMethod: "Visa ending in 4242",
    shippingMethod: "Standard Shipping (5-7 business days)",
    items,
    shippedItems: items.slice(0, 2), // First 2 items shipped
    remainingItems: items.slice(2), // Remaining items
    subtotal: "$109.97",
    shipping: "$8.99",
    tax: "$9.44",
    discount: "$10.00",
    discountCode: "BLESSED20",
    total: "$118.40",
    shippingAddress: generateAddress("Sarah Grace"),
    billingAddress: generateAddress("Sarah Grace"),
    estimatedDelivery: "January 22-24, 2024",
    expectedDelivery: "January 23, 2024",
    deliveryDate: "January 23, 2024",
    updatedDeliveryDate: "January 24, 2024",
    deliveryTime: "Between 2:00 PM - 6:00 PM",
    deliveryLocation: "Front porch",
    deliveryInstructions: "Please leave package by the front door",
    trackOrderUrl: "https://godwear.com/track/GW-2024-001234",
    trackingUrl: "https://ups.com/track/GW-2024-001234",
    trackingNumber: "1Z999AA1234567890",
    returnsUrl: "https://godwear.com/returns",
    carrier: "UPS",
    shipDate: "January 16, 2024",
    shippedDate: "January 16, 2024",
    shippingImageUrl: "https://godwear.com/images/shipping-box.jpg",
    statusMessage: "Your order has been delivered successfully",
    cancellationReason: "Customer requested cancellation",
    refund: {
      formattedAmount: "$118.40",
      method: "Original payment method",
    },
    giftMessage: "May God's blessings be with you always! - Love, Mom",
    proofOfDelivery: "Package delivered to front door, signed by resident",
    isPartialShipment: true,
  };
}

/**
 * Generate account template data - COMPLETE
 */
export function generateAccountTemplateData(): z.infer<typeof AccountTemplateDataSchema> {
  const common = generateCommonTemplateData();
  
  return {
    ...common,
    resetUrl: "https://godwear.com/reset-password?token=abc123def456",
    verificationUrl: "https://godwear.com/verify-email?token=xyz789uvw012",
    accountSettingsUrl: "https://godwear.com/account/settings",
    ipAddress: "192.168.1.100",
    device: "Chrome on Windows 11",
    timestamp: "January 15, 2024 at 2:30 PM CST",
    expiresAt: "January 15, 2024 at 3:30 PM CST",
    expiresInMinutes: 60,
    expiryTime: "3:30 PM CST",
    expiryHours: 1,
    updateDetails: "Email address updated from old@example.com to new@example.com",
    updateTypeDisplay: "Email Address Change",
    isNewUser: false,
  };
}

/**
 * Generate marketing template data - COMPLETE
 */
export function generateMarketingTemplateData(): z.infer<typeof MarketingTemplateDataSchema> {
  const common = generateCommonTemplateData();
  
  return {
    ...common,
    productName: "Faith Over Fear T-Shirt",
    productUrl: "https://godwear.com/products/faith-over-fear-tee",
    reviewUrl: "https://godwear.com/reviews/write?product=faith-over-fear-tee",
    discountCode: "BLESSED20",
    discountAmount: "20%",
    discountExpiryDate: "January 31, 2024",
    cartItems: generateCartItems(),
    cartTotal: "$37.98",
    cartUrl: "https://godwear.com/cart",
    recommendations: generateRecommendations(),
    incentive: "Free shipping on orders over $50",
    url: "https://godwear.com/special-offer",
  };
}

// ============================================================================
// TEMPLATE DATA VARIANTS - COMPLETE
// ============================================================================

/**
 * Generate different customer personas for testing
 */
export const CUSTOMER_PERSONAS = {
  sarah: {
    name: "Sarah Grace",
    firstName: "Sarah",
    email: "sarah.grace@example.com",
  },
  michael: {
    name: "Michael Faith",
    firstName: "Michael",
    email: "michael.faith@example.com",
  },
  rebecca: {
    name: "Rebecca Joy",
    firstName: "Rebecca",
    email: "rebecca.joy@example.com",
  },
  david: {
    name: "David Hope",
    firstName: "David",
    email: "david.hope@example.com",
  },
  mary: {
    name: "Mary Blessing",
    firstName: "Mary",
    email: "mary.blessing@example.com",
  },
};

/**
 * Generate Christian-themed product variations
 */
export const CHRISTIAN_PRODUCTS = [
  {
    name: "Faith Over Fear T-Shirt",
    imageUrl: "https://godwear.com/products/faith-over-fear-tee.jpg",
    variants: ["Navy Blue", "Heather Gray", "White", "Black"],
    price: "$29.99",
    sku: "FOF-TEE",
  },
  {
    name: "Blessed & Grateful Hoodie",
    imageUrl: "https://godwear.com/products/blessed-grateful-hoodie.jpg",
    variants: ["Heather Gray", "Navy Blue", "Burgundy"],
    price: "$49.99",
    sku: "BG-HOOD",
  },
  {
    name: "Proverbs 31 Woman Mug",
    imageUrl: "https://godwear.com/products/proverbs-31-mug.jpg",
    variants: ["White Ceramic", "Black Ceramic"],
    price: "$19.99",
    sku: "P31-MUG",
  },
  {
    name: "Jesus Loves You Keychain",
    imageUrl: "https://godwear.com/products/jesus-loves-keychain.jpg",
    variants: ["Silver", "Gold"],
    price: "$12.99",
    sku: "JLY-KEY",
  },
  {
    name: "Scripture Memory Cards Set",
    imageUrl: "https://godwear.com/products/scripture-cards.jpg",
    variants: ["Set of 50", "Set of 100"],
    price: "$24.99",
    sku: "SCR-CARDS",
  },
];

/**
 * Generate template data with specific persona
 */
export function generateTemplateDataForPersona(
  personaKey: keyof typeof CUSTOMER_PERSONAS,
  templateType: 'order' | 'account' | 'marketing'
): any {
  const persona = CUSTOMER_PERSONAS[personaKey];
  
  switch (templateType) {
    case 'order':
      const orderData = generateOrderTemplateData();
      return {
        ...orderData,
        name: persona.name,
        firstName: persona.firstName,
        shippingAddress: { ...orderData.shippingAddress, name: persona.name },
        billingAddress: { ...orderData.billingAddress, name: persona.name },
      };
      
    case 'account':
      const accountData = generateAccountTemplateData();
      return {
        ...accountData,
        name: persona.name,
        firstName: persona.firstName,
      };
      
    case 'marketing':
      const marketingData = generateMarketingTemplateData();
      return {
        ...marketingData,
        name: persona.name,
        firstName: persona.firstName,
      };
      
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

// ============================================================================
// TEMPLATE PROCESSING UTILITIES - ENHANCED
// ============================================================================

/**
 * Enhanced template variable replacement function
 * Handles ALL variable types found in templates
 */
export function processTemplate(template: string, data: Record<string, any>): string {
  let processed = template;
  
  // Handle simple variables like {{name}}, {{email}}, etc.
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    }
  });
  
  // Handle nested object properties like {{shippingAddress.name}}
  const nestedRegex = /{{(\w+)\.(\w+)}}/g;
  processed = processed.replace(nestedRegex, (match, objKey, propKey) => {
    const obj = data[objKey];
    if (obj && typeof obj === 'object' && propKey in obj) {
      return String(obj[propKey]);
    }
    return match; // Return original if not found
  });
  
  // Handle array iterations ({{#each items}})
  const eachRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g;
  processed = processed.replace(eachRegex, (match, arrayKey, itemTemplate) => {
    const array = data[arrayKey];
    if (Array.isArray(array)) {
      return array.map(item => {
        let itemHtml = itemTemplate;
        // Replace {{this.property}} with item properties
        Object.keys(item).forEach(prop => {
          const regex = new RegExp(`{{this\\.${prop}}}`, 'g');
          itemHtml = itemHtml.replace(regex, String(item[prop]));
        });
        return itemHtml;
      }).join('');
    }
    return match;
  });
  
  // Handle conditional blocks ({{#if condition}})
  const ifRegex = /{{#if (\w+)}}([\s\S]*?){{\/if}}/g;
  processed = processed.replace(ifRegex, (match, conditionKey, content) => {
    const condition = data[conditionKey];
    return condition ? content : '';
  });
  
  // Handle conditional blocks with nested properties ({{#if object.property}})
  const nestedIfRegex = /{{#if (\w+)\.(\w+)}}([\s\S]*?){{\/if}}/g;
  processed = processed.replace(nestedIfRegex, (match, objKey, propKey, content) => {
    const obj = data[objKey];
    const condition = obj && obj[propKey];
    return condition ? content : '';
  });
  
  // Handle else blocks
  const elseRegex = /{{else}}/g;
  processed = processed.replace(elseRegex, '');
  
  // Handle array length checks ({{#if array.length}})
  const lengthIfRegex = /{{#if (\w+)\.length}}([\s\S]*?){{\/if}}/g;
  processed = processed.replace(lengthIfRegex, (match, arrayKey, content) => {
    const array = data[arrayKey];
    return (Array.isArray(array) && array.length > 0) ? content : '';
  });
  
  return processed;
}

/**
 * Export type definitions for TypeScript support
 */
export type CommonTemplateData = z.infer<typeof CommonTemplateDataSchema>;
export type OrderTemplateData = z.infer<typeof OrderTemplateDataSchema>;
export type AccountTemplateData = z.infer<typeof AccountTemplateDataSchema>;
export type MarketingTemplateData = z.infer<typeof MarketingTemplateDataSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Refund = z.infer<typeof RefundSchema>;
