/**
 * Email tracking utilities
 */

/**
 * Generate a tracking pixel URL for email opens
 */
export function generateTrackingPixel(
  emailId: string,
  userId: string,
  campaignId?: string
): string {
  const baseUrl = "https://godwear.com/api/tracking/pixel";
  const params = new URLSearchParams({
    email_id: emailId,
    user_id: userId,
    timestamp: Date.now().toString(),
  });
  
  if (campaignId) {
    params.append("campaign_id", campaignId);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a tracking URL for email links
 */
export function generateTrackingUrl(
  destinationUrl: string,
  emailId: string,
  userId: string,
  linkId: string,
  campaignId?: string
): string {
  const baseUrl = "https://godwear.com/api/tracking/redirect";
  const params = new URLSearchParams({
    url: encodeURIComponent(destinationUrl),
    email_id: emailId,
    user_id: userId,
    link_id: linkId,
    timestamp: Date.now().toString(),
  });
  
  if (campaignId) {
    params.append("campaign_id", campaignId);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Add UTM parameters to a URL for campaign tracking
 */
export function addUtmParameters(
  url: string,
  source: string = "email",
  medium: string = "email",
  campaign: string = "transactional",
  content?: string,
  term?: string
): string {
  try {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    
    params.append("utm_source", source);
    params.append("utm_medium", medium);
    params.append("utm_campaign", campaign);
    
    if (content) {
      params.append("utm_content", content);
    }
    
    if (term) {
      params.append("utm_term", term);
    }
    
    return parsedUrl.toString();
  } catch (error) {
    // If URL parsing fails, append parameters manually
    const separator = url.includes("?") ? "&" : "?";
    let trackingParams = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
    
    if (content) {
      trackingParams += `&utm_content=${content}`;
    }
    
    if (term) {
      trackingParams += `&utm_term=${term}`;
    }
    
    return `${url}${separator}${trackingParams}`;
  }
}

/**
 * Generate a unique tracking ID for an email
 */
export function generateTrackingId(
  userId: string,
  templateName: string,
  timestamp: number = Date.now()
): string {
  const prefix = templateName.split("/").pop()?.substring(0, 3).toUpperCase() || "EML";
  const userPart = userId.substring(0, 6);
  const timePart = timestamp.toString(36).substring(-6);
  const randomPart = Math.random().toString(36).substring(2, 6);
  
  return `${prefix}-${userPart}-${timePart}-${randomPart}`;
}

/**
 * Add tracking data to email template variables
 */
export function addTrackingData(
  templateData: Record<string, any>,
  userId: string,
  templateName: string,
  campaignId?: string
): Record<string, any> {
  const emailId = generateTrackingId(userId, templateName);
  
  // Add tracking pixel
  const trackingPixel = generateTrackingPixel(emailId, userId, campaignId);
  
  // Process URLs for tracking
  const processedData = { ...templateData };
  
  // Add tracking to common URLs
  if (processedData.shopUrl) {
    processedData.shopUrl = generateTrackingUrl(
      addUtmParameters(processedData.shopUrl, "email", "email", templateName, "shop_button"),
      emailId,
      userId,
      "shop_button",
      campaignId
    );
  }
  
  if (processedData.cartUrl) {
    processedData.cartUrl = generateTrackingUrl(
      addUtmParameters(processedData.cartUrl, "email", "email", templateName, "cart_button"),
      emailId,
      userId,
      "cart_button",
      campaignId
    );
  }
  
  if (processedData.orderUrl) {
    processedData.orderUrl = generateTrackingUrl(
      addUtmParameters(processedData.orderUrl, "email", "email", templateName, "order_details"),
      emailId,
      userId,
      "order_details",
      campaignId
    );
  }
  
  // Add tracking to social media URLs
  ["facebookUrl", "instagramUrl", "twitterUrl"].forEach((key) => {
    if (processedData[key]) {
      processedData[key] = generateTrackingUrl(
        addUtmParameters(processedData[key], "email", "social", templateName, key),
        emailId,
        userId,
        key,
        campaignId
      );
    }
  });
  
  // Add tracking to recommendations
  if (Array.isArray(processedData.recommendations)) {
    processedData.recommendations = processedData.recommendations.map((item: any, index: number) => ({
      ...item,
      url: generateTrackingUrl(
        addUtmParameters(item.url, "email", "recommendation", templateName, `rec_${index}`),
        emailId,
        userId,
        `recommendation_${index}`,
        campaignId
      ),
    }));
  }
  
  return {
    ...processedData,
    trackingPixel,
    emailId,
  };
}
