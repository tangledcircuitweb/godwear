import { z } from "zod";
import type { BaseService, ServiceDependencies, ServiceHealthStatus } from "../../services/base";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Email event type enum
 */
const EmailEventTypeEnum = z.enum([
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "unsubscribed",
], {});

/**
 * Email event schema
 */
const EmailEventSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  userId: z.string().optional(),
  recipientEmail: z.string().email({}),
  eventType: EmailEventTypeEnum,
  timestamp: z.union([z.string(), z.date()], {}),
  provider: z.string(),
  campaignId: z.string().optional(),
  templateName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Click event schema
 */
const ClickEventSchema = EmailEventSchema.extend({
  eventType: z.literal("clicked"),
  linkId: z.string(),
  linkUrl: z.string().url(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  deviceType: z.string().optional(),
});

/**
 * Bounce event schema
 */
const BounceEventSchema = EmailEventSchema.extend({
  eventType: z.literal("bounced"),
  bounceType: z.enum(["hard", "soft", "complaint"], {}),
  bounceReason: z.string().optional(),
  diagnosticCode: z.string().optional(),
});

/**
 * Email analytics query schema
 */
const EmailAnalyticsQuerySchema = z.object({
  startDate: z.union([z.string(), z.date()], {}),
  endDate: z.union([z.string(), z.date()], {}).optional(),
  userId: z.string().optional(),
  recipientEmail: z.string().email({}).optional(),
  eventTypes: z.array(EmailEventTypeEnum).optional(),
  campaignId: z.string().optional(),
  templateName: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Email analytics result schema
 */
const EmailAnalyticsResultSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  events: z.array(EmailEventSchema),
});

/**
 * Email analytics metrics schema
 */
const EmailAnalyticsMetricsSchema = z.object({
  sent: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  opened: z.number().int().nonnegative(),
  clicked: z.number().int().nonnegative(),
  bounced: z.number().int().nonnegative(),
  complained: z.number().int().nonnegative(),
  unsubscribed: z.number().int().nonnegative(),
  deliveryRate: z.number().nonnegative(),
  openRate: z.number().nonnegative(),
  clickRate: z.number().nonnegative(),
  bounceRate: z.number().nonnegative(),
  complaintRate: z.number().nonnegative(),
  unsubscribeRate: z.number().nonnegative(),
  clickToOpenRate: z.number().nonnegative(),
});

/**
 * Email analytics metrics query schema
 */
const EmailAnalyticsMetricsQuerySchema = z.object({
  startDate: z.union([z.string(), z.date()], {}),
  endDate: z.union([z.string(), z.date()], {}).optional(),
  userId: z.string().optional(),
  recipientEmail: z.string().email({}).optional(),
  campaignId: z.string().optional(),
  templateName: z.string().optional(),
  groupBy: z.enum(["day", "week", "month", "campaign", "template"], {}).optional(),
});

/**
 * Email analytics metrics result schema
 */
const EmailAnalyticsMetricsResultSchema = z.object({
  overall: EmailAnalyticsMetricsSchema,
  breakdown: z.array(
    z.object({
      key: z.string(),
      metrics: EmailAnalyticsMetricsSchema,
    })
  ).optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type EmailEventType = z.infer<typeof EmailEventTypeEnum>;
export type EmailEvent = z.infer<typeof EmailEventSchema>;
export type ClickEvent = z.infer<typeof ClickEventSchema>;
export type BounceEvent = z.infer<typeof BounceEventSchema>;
export type EmailAnalyticsQuery = z.infer<typeof EmailAnalyticsQuerySchema>;
export type EmailAnalyticsResult = z.infer<typeof EmailAnalyticsResultSchema>;
export type EmailAnalyticsMetrics = z.infer<typeof EmailAnalyticsMetricsSchema>;
export type EmailAnalyticsMetricsQuery = z.infer<typeof EmailAnalyticsMetricsQuerySchema>;
export type EmailAnalyticsMetricsResult = z.infer<typeof EmailAnalyticsMetricsResultSchema>;

/**
 * Email analytics service interface
 */
export interface EmailAnalyticsService extends BaseService {
  /**
   * Track an email event
   */
  trackEvent(event: EmailEvent): Promise<void>;

  /**
   * Track a click event
   */
  trackClickEvent(event: ClickEvent): Promise<void>;

  /**
   * Track a bounce event
   */
  trackBounceEvent(event: BounceEvent): Promise<void>;

  /**
   * Query email events
   */
  queryEvents(query: EmailAnalyticsQuery): Promise<EmailAnalyticsResult>;

  /**
   * Get email metrics
   */
  getMetrics(query: EmailAnalyticsMetricsQuery): Promise<EmailAnalyticsMetricsResult>;

  /**
   * Get health status
   */
  getHealth(): Promise<ServiceHealthStatus>;
}

/**
 * Base email analytics service implementation
 */
export abstract class BaseEmailAnalyticsService implements EmailAnalyticsService {
  readonly serviceName = "email-analytics-service";
  protected env: Record<string, any> = {};
  protected logger?: ServiceDependencies["logger"];

  // Static schema exports
  static readonly EmailEventTypeEnum = EmailEventTypeEnum;
  static readonly EmailEventSchema = EmailEventSchema;
  static readonly ClickEventSchema = ClickEventSchema;
  static readonly BounceEventSchema = BounceEventSchema;
  static readonly EmailAnalyticsQuerySchema = EmailAnalyticsQuerySchema;
  static readonly EmailAnalyticsResultSchema = EmailAnalyticsResultSchema;
  static readonly EmailAnalyticsMetricsSchema = EmailAnalyticsMetricsSchema;
  static readonly EmailAnalyticsMetricsQuerySchema = EmailAnalyticsMetricsQuerySchema;
  static readonly EmailAnalyticsMetricsResultSchema = EmailAnalyticsMetricsResultSchema;

  /**
   * Initialize the email analytics service
   */
  initialize(dependencies: ServiceDependencies): void {
    this.env = dependencies.env;
    this.logger = dependencies.logger;
  }

  /**
   * Track an email event
   */
  abstract trackEvent(event: EmailEvent): Promise<void>;

  /**
   * Track a click event
   */
  abstract trackClickEvent(event: ClickEvent): Promise<void>;

  /**
   * Track a bounce event
   */
  abstract trackBounceEvent(event: BounceEvent): Promise<void>;

  /**
   * Query email events
   */
  abstract queryEvents(query: EmailAnalyticsQuery): Promise<EmailAnalyticsResult>;

  /**
   * Get email metrics
   */
  abstract getMetrics(query: EmailAnalyticsMetricsQuery): Promise<EmailAnalyticsMetricsResult>;

  /**
   * Get health status
   */
  abstract getHealth(): Promise<ServiceHealthStatus>;

  /**
   * Validate an email event
   */
  protected validateEmailEvent(event: EmailEvent): EmailEvent {
    return EmailEventSchema.parse(event);
  }

  /**
   * Validate a click event
   */
  protected validateClickEvent(event: ClickEvent): ClickEvent {
    return ClickEventSchema.parse(event);
  }

  /**
   * Validate a bounce event
   */
  protected validateBounceEvent(event: BounceEvent): BounceEvent {
    return BounceEventSchema.parse(event);
  }

  /**
   * Validate an analytics query
   */
  protected validateAnalyticsQuery(query: EmailAnalyticsQuery): EmailAnalyticsQuery {
    return EmailAnalyticsQuerySchema.parse(query);
  }

  /**
   * Validate a metrics query
   */
  protected validateMetricsQuery(query: EmailAnalyticsMetricsQuery): EmailAnalyticsMetricsQuery {
    return EmailAnalyticsMetricsQuerySchema.parse(query);
  }
}
