import { BaseEmailAnalyticsService, type EmailAnalyticsMetricsQuery, type EmailAnalyticsMetricsResult, type EmailAnalyticsQuery, type EmailAnalyticsResult, type EmailEvent, type ClickEvent, type BounceEvent } from "./email-analytics-service";
import type { ServiceHealthStatus } from "../../services/base";

/**
 * In-memory implementation of email analytics service for development and testing
 */
export class InMemoryEmailAnalyticsService extends BaseEmailAnalyticsService {
  readonly serviceName = "in-memory-email-analytics-service";
  private events: EmailEvent[] = [];

  /**
   * Track an email event
   */
  async trackEvent(event: EmailEvent): Promise<void> {
    try {
      const validatedEvent = this.validateEmailEvent({
        ...event,
        id: event.id || crypto.randomUUID(),
        timestamp: event.timestamp || new Date(),
      });
      
      this.events.push(validatedEvent);
      this.logger?.debug("Tracked email event", { eventType: validatedEvent.eventType, emailId: validatedEvent.emailId });
    } catch (error) {
      this.logger?.error("Failed to track email event", error as Error);
      throw error;
    }
  }

  /**
   * Track a click event
   */
  async trackClickEvent(event: ClickEvent): Promise<void> {
    try {
      const validatedEvent = this.validateClickEvent({
        ...event,
        id: event.id || crypto.randomUUID(),
        timestamp: event.timestamp || new Date(),
      });
      
      this.events.push(validatedEvent);
      this.logger?.debug("Tracked click event", { emailId: validatedEvent.emailId, linkId: validatedEvent.linkId });
    } catch (error) {
      this.logger?.error("Failed to track click event", error as Error);
      throw error;
    }
  }

  /**
   * Track a bounce event
   */
  async trackBounceEvent(event: BounceEvent): Promise<void> {
    try {
      const validatedEvent = this.validateBounceEvent({
        ...event,
        id: event.id || crypto.randomUUID(),
        timestamp: event.timestamp || new Date(),
      });
      
      this.events.push(validatedEvent);
      this.logger?.debug("Tracked bounce event", { emailId: validatedEvent.emailId, bounceType: validatedEvent.bounceType });
    } catch (error) {
      this.logger?.error("Failed to track bounce event", error as Error);
      throw error;
    }
  }

  /**
   * Query email events
   */
  async queryEvents(query: EmailAnalyticsQuery): Promise<EmailAnalyticsResult> {
    try {
      const validatedQuery = this.validateAnalyticsQuery(query);
      
      // Convert dates to timestamps for comparison
      const startTimestamp = new Date(validatedQuery.startDate).getTime();
      const endTimestamp = validatedQuery.endDate 
        ? new Date(validatedQuery.endDate).getTime() 
        : Date.now();
      
      // Filter events based on query parameters
      let filteredEvents = this.events.filter(event => {
        const eventTimestamp = new Date(event.timestamp).getTime();
        
        // Check date range
        if (eventTimestamp < startTimestamp || eventTimestamp > endTimestamp) {
          return false;
        }
        
        // Check user ID if provided
        if (validatedQuery.userId && event.userId !== validatedQuery.userId) {
          return false;
        }
        
        // Check recipient email if provided
        if (validatedQuery.recipientEmail && event.recipientEmail !== validatedQuery.recipientEmail) {
          return false;
        }
        
        // Check event types if provided
        if (validatedQuery.eventTypes && !validatedQuery.eventTypes.includes(event.eventType)) {
          return false;
        }
        
        // Check campaign ID if provided
        if (validatedQuery.campaignId && event.campaignId !== validatedQuery.campaignId) {
          return false;
        }
        
        // Check template name if provided
        if (validatedQuery.templateName && event.templateName !== validatedQuery.templateName) {
          return false;
        }
        
        return true;
      });
      
      // Sort by timestamp (newest first)
      filteredEvents.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampB - timestampA;
      });
      
      // Apply pagination
      const totalCount = filteredEvents.length;
      const offset = validatedQuery.offset || 0;
      const limit = validatedQuery.limit || 100;
      
      filteredEvents = filteredEvents.slice(offset, offset + limit);
      
      return {
        totalCount,
        events: filteredEvents,
      };
    } catch (error) {
      this.logger?.error("Failed to query email events", error as Error);
      throw error;
    }
  }

  /**
   * Get email metrics
   */
  async getMetrics(query: EmailAnalyticsMetricsQuery): Promise<EmailAnalyticsMetricsResult> {
    try {
      const validatedQuery = this.validateMetricsQuery(query);
      
      // Convert dates to timestamps for comparison
      const startTimestamp = new Date(validatedQuery.startDate).getTime();
      const endTimestamp = validatedQuery.endDate 
        ? new Date(validatedQuery.endDate).getTime() 
        : Date.now();
      
      // Filter events based on query parameters
      const filteredEvents = this.events.filter(event => {
        const eventTimestamp = new Date(event.timestamp).getTime();
        
        // Check date range
        if (eventTimestamp < startTimestamp || eventTimestamp > endTimestamp) {
          return false;
        }
        
        // Check user ID if provided
        if (validatedQuery.userId && event.userId !== validatedQuery.userId) {
          return false;
        }
        
        // Check recipient email if provided
        if (validatedQuery.recipientEmail && event.recipientEmail !== validatedQuery.recipientEmail) {
          return false;
        }
        
        // Check campaign ID if provided
        if (validatedQuery.campaignId && event.campaignId !== validatedQuery.campaignId) {
          return false;
        }
        
        // Check template name if provided
        if (validatedQuery.templateName && event.templateName !== validatedQuery.templateName) {
          return false;
        }
        
        return true;
      });
      
      // Calculate overall metrics
      const overall = this.calculateMetrics(filteredEvents);
      
      // Calculate breakdown metrics if requested
      let breakdown;
      
      if (validatedQuery.groupBy) {
        const groups = new Map<string, EmailEvent[]>();
        
        // Group events by the specified field
        for (const event of filteredEvents) {
          let key: string;
          
          switch (validatedQuery.groupBy) {
            case "day":
              key = new Date(event.timestamp).toISOString().split("T")[0];
              break;
            case "week":
              key = this.getWeekKey(new Date(event.timestamp));
              break;
            case "month":
              key = new Date(event.timestamp).toISOString().substring(0, 7);
              break;
            case "campaign":
              key = event.campaignId || "unknown";
              break;
            case "template":
              key = event.templateName || "unknown";
              break;
            default:
              key = "unknown";
          }
          
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          
          groups.get(key)!.push(event);
        }
        
        // Calculate metrics for each group
        breakdown = Array.from(groups.entries()).map(([key, events]) => ({
          key,
          metrics: this.calculateMetrics(events),
        }));
        
        // Sort breakdown by key
        breakdown.sort((a, b) => a.key.localeCompare(b.key));
      }
      
      return {
        overall,
        breakdown,
      };
    } catch (error) {
      this.logger?.error("Failed to get email metrics", error as Error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    return {
      status: "healthy",
      message: "In-memory email analytics service is operational",
      details: {
        eventCount: this.events.length,
        memoryUsage: process.memoryUsage().heapUsed,
      },
    };
  }

  /**
   * Calculate metrics from a list of events
   */
  private calculateMetrics(events: EmailEvent[]): EmailAnalyticsMetricsResult["overall"] {
    // Count events by type
    const sent = events.filter(e => e.eventType === "sent").length;
    const delivered = events.filter(e => e.eventType === "delivered").length;
    const opened = events.filter(e => e.eventType === "opened").length;
    const clicked = events.filter(e => e.eventType === "clicked").length;
    const bounced = events.filter(e => e.eventType === "bounced").length;
    const complained = events.filter(e => e.eventType === "complained").length;
    const unsubscribed = events.filter(e => e.eventType === "unsubscribed").length;
    
    // Calculate rates
    const deliveryRate = sent > 0 ? delivered / sent : 0;
    const openRate = delivered > 0 ? opened / delivered : 0;
    const clickRate = delivered > 0 ? clicked / delivered : 0;
    const bounceRate = sent > 0 ? bounced / sent : 0;
    const complaintRate = delivered > 0 ? complained / delivered : 0;
    const unsubscribeRate = delivered > 0 ? unsubscribed / delivered : 0;
    const clickToOpenRate = opened > 0 ? clicked / opened : 0;
    
    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      unsubscribed,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      complaintRate,
      unsubscribeRate,
      clickToOpenRate,
    };
  }

  /**
   * Get a week key for a date (e.g., "2025-W29")
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }
}
