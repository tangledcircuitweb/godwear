/**
 * Personalization utilities for email templates
 */

/**
 * Generate personalized greeting based on time of day and user name
 */
export function generateGreeting(name: string, locale: string = "en-US"): string {
  const hour = new Date().getHours();
  let greeting = "";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return `${greeting}, ${name}`;
}

/**
 * Generate personalized product recommendations based on user preferences and history
 */
export function generateRecommendations(
  userId: string,
  preferences: Record<string, any>,
  purchaseHistory: Record<string, any>[],
  availableProducts: Record<string, any>[],
  count: number = 3
): Record<string, any>[] {
  // This is a simplified implementation
  // In a real system, this would use a recommendation algorithm
  
  // Filter out products the user has already purchased
  const purchasedProductIds = purchaseHistory.map((purchase) => purchase.productId);
  const candidateProducts = availableProducts.filter(
    (product) => !purchasedProductIds.includes(product.id)
  );

  // Sort by relevance to user preferences (simplified)
  const scoredProducts = candidateProducts.map((product) => {
    let score = 0;
    
    // Score based on category preference
    if (preferences.categories?.includes(product.category)) {
      score += 10;
    }
    
    // Score based on brand preference
    if (preferences.brands?.includes(product.brand)) {
      score += 5;
    }
    
    // Score based on price range
    if (
      preferences.priceRange?.min <= product.price &&
      preferences.priceRange?.max >= product.price
    ) {
      score += 3;
    }
    
    return {
      ...product,
      score,
    };
  });

  // Sort by score and return top recommendations
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ score, ...product }) => product);
}

/**
 * Generate personalized discount code based on user segment and history
 */
export function generatePersonalizedDiscount(
  userId: string,
  purchaseHistory: Record<string, any>[],
  userSegment: string,
  cartValue: number
): { code: string; percentage: number; expiryHours: number } {
  // Default values
  let percentage = 10;
  let expiryHours = 24;
  
  // Adjust based on user segment
  if (userSegment === "VIP") {
    percentage = 15;
    expiryHours = 48;
  } else if (userSegment === "NEW") {
    percentage = 12;
    expiryHours = 24;
  }
  
  // Adjust based on cart value
  if (cartValue > 200) {
    percentage += 5;
  } else if (cartValue > 100) {
    percentage += 2;
  }
  
  // Cap discount percentage
  percentage = Math.min(percentage, 20);
  
  // Generate unique code
  const code = `SAVE${percentage}_${userId.substring(0, 6).toUpperCase()}`;
  
  return {
    code,
    percentage,
    expiryHours,
  };
}

/**
 * Format user name for personalized greeting
 */
export function formatName(firstName: string, lastName?: string): string {
  if (!firstName && !lastName) return "there";
  return firstName || lastName || "there";
}

/**
 * Generate personalized subject line
 */
export function generateSubjectLine(
  templateType: string,
  data: Record<string, any>
): string {
  switch (templateType) {
    case "welcome":
      return `Welcome to GodWear, ${formatName(data.firstName, data.lastName)}!`;
    
    case "order-confirmation":
      return `Order Confirmed: #${data.orderNumber} - Thank You!`;
    
    case "shipping-notification":
      return `Your Order #${data.orderNumber} Has Shipped!`;
    
    case "abandoned-cart":
      return data.discount
        ? `${formatName(data.firstName, data.lastName)}, Save ${data.discount}% on Items in Your Cart`
        : `${formatName(data.firstName, data.lastName)}, Complete Your GodWear Purchase`;
    
    case "password-reset":
      return "Reset Your GodWear Password";
    
    default:
      return "Important Information from GodWear";
  }
}
