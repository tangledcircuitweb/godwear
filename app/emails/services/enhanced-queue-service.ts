import { z } from "zod";
import { BaseEmailService } from "./email-service";
import { TransactionalEmailService } from "./transactional-email-service";
import type { ServiceDependencies, ServiceHealthStatus } from "../../services/base";

// ============================================================================
// LOCAL SCHEMAS - AI-First file-local approach
// ============================================================================

/**
 * Local email recipient schema for this service
 */
const LocalEmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

/**
 * Local email attachment schema for this service
 */
const LocalEmailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)], {}),
  contentType: z.string().optional(),
  disposition: z.enum(["attachment", "inline"], {}).optional(),
  id: z.string().optional(),
});

/**
 * Local raw email options schema for this service
 */
const LocalRawEmailOptionsSchema = z.object({
  recipient: LocalEmailRecipientSchema,
  cc: z.array(LocalEmailRecipientSchema).optional(),
  bcc: z.array(LocalEmailRecipientSchema).optional(),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
  attachments: z.array(LocalEmailAttachmentSchema).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  replyTo: LocalEmailRecipientSchema.optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * Local templated email options schema for this service
 */
const LocalTemplatedEmailOptionsSchema = z.object({
  recipient: LocalEmailRecipientSchema,
  cc: z.array(LocalEmailRecipientSchema).optional(),
  bcc: z.array(LocalEmailRecipientSchema).optional(),
  subject: z.string(),
  templateName: z.string(),
  data: z.record(z.string(), z.unknown()),
  attachments: z.array(LocalEmailAttachmentSchema).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  replyTo: LocalEmailRecipientSchema.optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * Local email result schema for this service
 */
const LocalEmailResultSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  provider: z.string(),
  recipient: z.string(),
  subject: z.string(),
  messageId: z.string().optional(),
  error: z.string().optional(),
  templateName: z.string().optional(),
  status: z.string().optional(),
});

/**
 * Local email status schema for this service
 */
const LocalEmailStatusSchema = z.object({
  id: z.string(),
  status: z.enum([
    "queued", 
    "scheduled", 
    "sending", 
    "sent", 
    "delivered", 
    "failed", 
    "bounced", 
    "rejected", 
    "cancelled"
  ], {}),
  recipient: z.string(),
  subject: z.string(),
  scheduledFor: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Local resend options schema for this service
 */
const LocalResendOptionsSchema = z.object({
  maxAttempts: z.number().int().positive().default(3),
  delay: z.number().int().nonnegative().default(1000),
  backoff: z.enum(["linear", "exponential"], {}).default("exponential"),
});

// Type inference for local schemas
type LocalEmailRecipient = z.infer<typeof LocalEmailRecipientSchema>;
type LocalEmailAttachment = z.infer<typeof LocalEmailAttachmentSchema>;
type LocalRawEmailOptions = z.infer<typeof LocalRawEmailOptionsSchema>;
type LocalTemplatedEmailOptions = z.infer<typeof LocalTemplatedEmailOptionsSchema>;
type LocalEmailResult = z.infer<typeof LocalEmailResultSchema>;
type LocalEmailStatus = z.infer<typeof LocalEmailStatusSchema>;
type LocalResendOptions = z.infer<typeof LocalResendOptionsSchema>;

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Local environment schema for this service - AI-First file-local approach
 * Each file defines its own environment validation schema
 */
const LocalEnvironmentSchema = z.object({
  EMAIL_QUEUE_MAX_CONCURRENT: z.string().optional(),
  EMAIL_QUEUE_RATE_CRITICAL: z.string().optional(),
  EMAIL_QUEUE_RATE_HIGH: z.string().optional(),
  EMAIL_QUEUE_RATE_MEDIUM: z.string().optional(),
  EMAIL_QUEUE_RATE_LOW: z.string().optional(),
  EMAIL_INTERVAL_CRITICAL: z.string().optional(),
  EMAIL_INTERVAL_HIGH: z.string().optional(),
  EMAIL_INTERVAL_MEDIUM: z.string().optional(),
  EMAIL_INTERVAL_LOW: z.string().optional(),
  EMAIL_INTERVAL_TESTING: z.string().optional(),
  EMAIL_QUEUE_RETRY_DELAYS: z.string().optional(),
  EMAIL_QUEUE_PERSISTENCE_KEY: z.string().optional(),
  EMAIL_QUEUE_MAX_SIZE: z.string().optional(),
  EMAIL_QUEUE_BATCH_SIZE: z.string().optional(),
  EMAIL_QUEUE_PROCESSING_INTERVAL: z.string().optional(),
  EMAIL_QUEUE_CLEANUP_INTERVAL: z.string().optional(),
  EMAIL_QUEUE_MAX_AGE: z.string().optional(),
  EMAIL_QUEUE_PRIORITY_BOOST_RETRY: z.string().optional(),
  EMAIL_QUEUE_PRIORITY_BOOST_WAIT: z.string().optional(),
  EMAIL_TESTING_MODE: z.string().optional(),
  EMAIL_DOMAIN_THROTTLES: z.string().optional(),
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

/**
 * Email priority enum
 */
const EmailPriorityEnum = z.enum(["critical", "high", "medium", "low"], {});

/**
 * Queue item schema
 */
const QueueItemSchema = z.object({
  id: z.string(),
  type: z.enum(["raw", "templated"], {}),
  options: z.union([
    z.object({ type: z.literal("raw"), data: z.any() }),
    z.object({ type: z.literal("templated"), data: z.any() }),
  ], {}),
  priority: EmailPriorityEnum,
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  nextAttempt: z.number().int().nonnegative(),
  createdAt: z.number().int().nonnegative(),
  scheduledFor: z.number().int().nonnegative(),
  status: z.enum(["pending", "processing", "completed", "failed", "cancelled"], {}),
  result: z.any().optional(),
  error: z.string().optional(),
  // New fields for enhanced scheduling and prioritization
  lastAttempt: z.number().int().nonnegative().optional(),
  dynamicPriority: z.number().nonnegative().optional(), // Calculated priority score
  tags: z.array(z.string()).optional(),                 // For filtering and grouping
  recipientDomain: z.string().optional(),               // For domain-based rate limiting
  idempotencyKey: z.string().optional(),                // For deduplication
});

/**
 * Queue options schema
 */
const QueueOptionsSchema = z.object({
  maxConcurrent: z.number().int().positive().default(5),
  rateLimit: z.object({
    critical: z.number().int().nonnegative().default(0), // No limit
    high: z.number().int().nonnegative().default(10),    // 10 per second
    medium: z.number().int().nonnegative().default(5),   // 5 per second
    low: z.number().int().nonnegative().default(2),      // 2 per second
  }).default({
    critical: 0,
    high: 10,
    medium: 5,
    low: 2
  }),
  // Configurable timing intervals between emails (in milliseconds)
  emailIntervals: z.object({
    critical: z.number().int().nonnegative().default(0),     // No delay for critical emails
    high: z.number().int().nonnegative().default(60000),    // 60 seconds between high priority emails
    medium: z.number().int().nonnegative().default(60000),  // 60 seconds between medium priority emails
    low: z.number().int().nonnegative().default(60000),     // 60 seconds between low priority emails
    testing: z.number().int().nonnegative().default(60000), // 60 seconds for testing mode
  }).default({
    critical: 0,
    high: 60000,
    medium: 60000,
    low: 60000,
    testing: 60000
  }),
  retryDelays: z.array(z.number().int().nonnegative()).default([1000, 5000, 15000, 60000]),
  persistenceKey: z.string().optional(),
  // Enhanced scheduling and rate limiting options
  maxQueueSize: z.number().int().positive().default(1000),
  batchSize: z.number().int().positive().default(10),
  processingInterval: z.number().int().positive().default(1000), // ms
  cleanupInterval: z.number().int().positive().default(60000),   // ms
  maxAge: z.number().int().positive().default(7 * 24 * 60 * 60 * 1000), // 7 days
  priorityBoost: z.object({
    retryCount: z.number().nonnegative().default(0.1), // Priority boost per retry
    waitTime: z.number().nonnegative().default(0.01),  // Priority boost per minute waiting
  }).default({
    retryCount: 0.1,
    waitTime: 0.01
  }),
  // Testing mode configuration
  testingMode: z.boolean().default(false), // When true, uses testing intervals
});

/**
 * Enqueue options schema
 */
const EnqueueOptionsSchema = z.object({
  priority: EmailPriorityEnum.default("medium"),
  maxAttempts: z.number().int().positive().default(3),
  scheduledFor: z.union([z.number().int().nonnegative(), z.date()], {}).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type EmailPriority = z.infer<typeof EmailPriorityEnum>;
type QueueItem = z.infer<typeof QueueItemSchema>;
type QueueOptions = z.infer<typeof QueueOptionsSchema>;
type EnqueueOptions = z.infer<typeof EnqueueOptionsSchema>;

/**
 * Rate limiter for controlling email sending rates
 */
class RateLimiter {
  private lastSendTimes: Record<EmailPriority, number[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  private domainLimits: Map<string, { lastSend: number; limit: number }> = new Map();

  constructor(private rateLimit: QueueOptions["rateLimit"]) {}

  /**
   * Check if sending is allowed for the given priority
   */
  canSend(priority: EmailPriority): boolean {
    const limit = this.rateLimit[priority];
    if (limit === 0) return true; // No limit

    const now = Date.now();
    const recentSends = this.lastSendTimes[priority].filter(
      time => now - time < 1000 // Within the last second
    );

    return recentSends.length < limit;
  }

  /**
   * Check if sending is allowed for the given domain
   */
  canSendToDomain(domain: string): boolean {
    const domainLimit = this.domainLimits.get(domain);
    if (!domainLimit) return true;

    const now = Date.now();
    return now - domainLimit.lastSend >= 1000 / domainLimit.limit;
  }

  /**
   * Record a send for the given priority
   */
  recordSend(priority: EmailPriority): void {
    const now = Date.now();
    this.lastSendTimes[priority].push(now);

    // Clean up old entries
    this.lastSendTimes[priority] = this.lastSendTimes[priority].filter(
      time => now - time < 1000
    );
  }

  /**
   * Record a send for the given domain
   */
  recordDomainSend(domain: string): void {
    const now = Date.now();
    const domainLimit = this.domainLimits.get(domain);
    
    if (domainLimit) {
      domainLimit.lastSend = now;
    }
  }

  /**
   * Set a rate limit for a specific domain
   */
  setDomainLimit(domain: string, limit: number): void {
    this.domainLimits.set(domain, {
      lastSend: 0,
      limit,
    });
  }

  /**
   * Remove a domain rate limit
   */
  removeDomainLimit(domain: string): void {
    this.domainLimits.delete(domain);
  }

  /**
   * Get all domain limits
   */
  getDomainLimits(): Record<string, number> {
    const limits: Record<string, number> = {};
    this.domainLimits.forEach((value, key) => {
      limits[key] = value.limit;
    });
    return limits;
  }
}
/**
 * Enhanced email queue service for scheduling and rate limiting
 */
export class EnhancedEmailQueueService extends BaseEmailService {
  override readonly serviceName = "enhanced-email-queue-service";
  private emailService!: TransactionalEmailService;
  private queue: QueueItem[] = [];
  private options!: QueueOptions;
  private processing = false;
  private activeCount = 0;
  private rateLimiter!: RateLimiter;
  private processingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private persistenceInterval: NodeJS.Timeout | null = null;
  private domainThrottles: Map<string, number> = new Map();
  private idempotencyCache: Set<string> = new Set();
  private lastSendTimes: Map<string, number> = new Map(); // Track last send times for timing intervals
  private stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    cancelled: 0,
    rateDelayed: 0,
    domainDelayed: 0,
  };

  constructor() {
    super();
  }

  /**
   * Initialize the email queue service
   */
  override initialize(dependencies: ServiceDependencies): void {
    super.initialize(dependencies);

    // Parse queue options from environment using AI-First file-local approach
    this.options = QueueOptionsSchema.parse({
      maxConcurrent: Number(this.env['EMAIL_QUEUE_MAX_CONCURRENT'] || 5),
      rateLimit: {
        critical: Number(this.env['EMAIL_QUEUE_RATE_CRITICAL'] || 0),
        high: Number(this.env['EMAIL_QUEUE_RATE_HIGH'] || 10),
        medium: Number(this.env['EMAIL_QUEUE_RATE_MEDIUM'] || 5),
        low: Number(this.env['EMAIL_QUEUE_RATE_LOW'] || 2),
      },
      emailIntervals: {
        critical: Number(this.env['EMAIL_INTERVAL_CRITICAL'] || 0),
        high: Number(this.env['EMAIL_INTERVAL_HIGH'] || 60000),
        medium: Number(this.env['EMAIL_INTERVAL_MEDIUM'] || 60000),
        low: Number(this.env['EMAIL_INTERVAL_LOW'] || 60000),
        testing: Number(this.env['EMAIL_INTERVAL_TESTING'] || 60000),
      },
      retryDelays: this.env['EMAIL_QUEUE_RETRY_DELAYS']
        ? JSON.parse(this.env['EMAIL_QUEUE_RETRY_DELAYS'])
        : [1000, 5000, 15000, 60000],
      persistenceKey: this.env['EMAIL_QUEUE_PERSISTENCE_KEY'],
      maxQueueSize: Number(this.env['EMAIL_QUEUE_MAX_SIZE'] || 1000),
      batchSize: Number(this.env['EMAIL_QUEUE_BATCH_SIZE'] || 10),
      processingInterval: Number(this.env['EMAIL_QUEUE_PROCESSING_INTERVAL'] || 1000),
      cleanupInterval: Number(this.env['EMAIL_QUEUE_CLEANUP_INTERVAL'] || 60000),
      maxAge: Number(this.env['EMAIL_QUEUE_MAX_AGE'] || 7 * 24 * 60 * 60 * 1000),
      priorityBoost: {
        retryCount: Number(this.env['EMAIL_QUEUE_PRIORITY_BOOST_RETRY'] || 0.1),
        waitTime: Number(this.env['EMAIL_QUEUE_PRIORITY_BOOST_WAIT'] || 0.01),
      },
      testingMode: this.env['EMAIL_TESTING_MODE'] === "true",
    });

    // Initialize the email service
    this.emailService = new TransactionalEmailService();
    this.emailService.initialize(dependencies);

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(this.options.rateLimit);

    // Load persisted queue if available
    this.loadQueue();

    // Set up intervals
    if (this.options.persistenceKey) {
      this.persistenceInterval = setInterval(() => {
        this.persistQueue();
      }, 60000); // Save queue every minute
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.options.processingInterval);

    this.cleanupInterval = setInterval(() => {
      this.cleanupQueue();
    }, this.options.cleanupInterval);

    // Configure domain throttling from environment using AI-First approach
    if (this.env['EMAIL_DOMAIN_THROTTLES']) {
      try {
        const throttles = JSON.parse(this.env['EMAIL_DOMAIN_THROTTLES']);
        Object.entries(throttles).forEach(([domain, limit]) => {
          this.setDomainThrottle(domain, Number(limit));
        });
      } catch (error) {
        this.logger?.error("Failed to parse domain throttles", error as Error);
      }
    }

    // Start processing the queue
    this.processQueue();
  }

  /**
   * Send a raw email (enqueues for processing)
   */
  async sendRawEmail(
    options: LocalRawEmailOptions,
    enqueueOptions?: Partial<EnqueueOptions>
  ): Promise<LocalEmailResult> {
    const opts = EnqueueOptionsSchema.parse({
      ...enqueueOptions,
      priority: enqueueOptions?.priority || "medium",
    });

    // Check if queue is full
    if (this.queue.length >= this.options.maxQueueSize) {
      // If queue is full, only allow critical emails
      if (opts.priority !== "critical") {
        return {
          success: false,
          error: "Email queue is full",
          timestamp: new Date().toISOString(),
          provider: "queue",
          recipient: options.recipient.email,
          subject: options.subject,
          status: "rejected",
        };
      }
    }

    // Check for idempotency key to prevent duplicates
    if (options.idempotencyKey) {
      if (this.idempotencyCache.has(options.idempotencyKey)) {
        return {
          success: false,
          error: "Duplicate email with same idempotency key",
          timestamp: new Date().toISOString(),
          provider: "queue",
          recipient: options.recipient.email,
          subject: options.subject,
          status: "rejected",
        };
      }
      this.idempotencyCache.add(options.idempotencyKey);
    }

    // Extract recipient domain for domain-based throttling
    const recipientEmail = options.recipient.email;
    const recipientDomain = recipientEmail.split("@")[1];

    const queueItem: QueueItem = {
      id: crypto.randomUUID(),
      type: "raw",
      options: { type: "raw", data: options },
      priority: opts.priority,
      attempts: 0,
      maxAttempts: opts.maxAttempts,
      nextAttempt: Date.now(),
      createdAt: Date.now(),
      scheduledFor: opts.scheduledFor
        ? opts.scheduledFor instanceof Date
          ? opts.scheduledFor.getTime()
          : opts.scheduledFor
        : Date.now(),
      status: "pending",
      dynamicPriority: 0,
      recipientDomain,
      idempotencyKey: options.idempotencyKey,
      tags: opts.tags || options.metadata?.tags as string[] || [],
    };

    this.queue.push(queueItem);
    this.sortQueue();

    // Save queue if persistence is enabled
    if (this.options.persistenceKey) {
      this.persistQueue();
    }

    // Trigger queue processing
    if (!this.processing) {
      this.processQueue();
    }

    // Return a preliminary result
    return {
      success: true,
      messageId: queueItem.id,
      timestamp: new Date().toISOString(),
      provider: "queue",
      recipient: recipientEmail,
      subject: options.subject,
      status: "queued",
    };
  }

  /**
   * Send a templated email (enqueues for processing)
   */
  async sendTemplatedEmail(
    options: LocalTemplatedEmailOptions,
    enqueueOptions?: Partial<EnqueueOptions>
  ): Promise<LocalEmailResult> {
    const opts = EnqueueOptionsSchema.parse({
      ...enqueueOptions,
      priority: enqueueOptions?.priority || "medium",
    });

    // Check if queue is full
    if (this.queue.length >= this.options.maxQueueSize) {
      // If queue is full, only allow critical emails
      if (opts.priority !== "critical") {
        return {
          success: false,
          error: "Email queue is full",
          timestamp: new Date().toISOString(),
          provider: "queue",
          recipient: options.recipient.email,
          subject: options.subject,
          status: "rejected",
        };
      }
    }

    // Check for idempotency key to prevent duplicates
    if (options.idempotencyKey) {
      if (this.idempotencyCache.has(options.idempotencyKey)) {
        return {
          success: false,
          error: "Duplicate email with same idempotency key",
          timestamp: new Date().toISOString(),
          provider: "queue",
          recipient: options.recipient.email,
          subject: options.subject,
          status: "rejected",
        };
      }
      this.idempotencyCache.add(options.idempotencyKey);
    }

    // Extract recipient domain for domain-based throttling
    const recipientEmail = options.recipient.email;
    const recipientDomain = recipientEmail.split("@")[1];

    const queueItem: QueueItem = {
      id: crypto.randomUUID(),
      type: "templated",
      options: { type: "templated", data: options },
      priority: opts.priority,
      attempts: 0,
      maxAttempts: opts.maxAttempts,
      nextAttempt: Date.now(),
      createdAt: Date.now(),
      scheduledFor: opts.scheduledFor
        ? opts.scheduledFor instanceof Date
          ? opts.scheduledFor.getTime()
          : opts.scheduledFor
        : Date.now(),
      status: "pending",
      dynamicPriority: 0,
      recipientDomain,
      idempotencyKey: options.idempotencyKey,
      tags: opts.tags || options.metadata?.tags as string[] || [],
    };

    this.queue.push(queueItem);
    this.sortQueue();

    // Save queue if persistence is enabled
    if (this.options.persistenceKey) {
      this.persistQueue();
    }

    // Trigger queue processing
    if (!this.processing) {
      this.processQueue();
    }

    // Return a preliminary result
    return {
      success: true,
      messageId: queueItem.id,
      timestamp: new Date().toISOString(),
      provider: "queue",
      recipient: recipientEmail,
      templateName: options.templateName,
      subject: options.subject,
      status: "queued",
    };
  }
  /**
   * Schedule an email for future delivery
   */
  async scheduleEmail(
    options: LocalRawEmailOptions | LocalTemplatedEmailOptions,
    scheduledFor: Date | number,
    enqueueOptions?: Partial<Omit<EnqueueOptions, "scheduledFor">>
  ): Promise<LocalEmailResult> {
    const isRaw = "html" in options || "text" in options;

    if (isRaw) {
      return this.sendRawEmail(options as LocalRawEmailOptions, {
        ...enqueueOptions,
        scheduledFor,
      });
    } else {
      return this.sendTemplatedEmail(options as LocalTemplatedEmailOptions, {
        ...enqueueOptions,
        scheduledFor,
      });
    }
  }

  /**
   * Resend an email
   */
  async resendEmail(emailId: string, options?: LocalResendOptions): Promise<LocalEmailResult> {
    try {
      // Validate options if provided
      const validatedOptions = options ? LocalResendOptionsSchema.parse(options) : undefined;
      
      // Find the email in the queue
      const queueItem = this.queue.find(item => item.id === emailId);
      
      if (!queueItem) {
        // If not in the queue, try to resend via the underlying email service
        return await this.emailService.resendEmail(emailId, validatedOptions);
      }
      
      // If the email is already completed or failed, create a new queue item
      if (queueItem.status === "completed" || queueItem.status === "failed") {
        // Create a new queue item based on the original
        const newItem = {
          ...queueItem,
          id: crypto.randomUUID(),
          attempts: 0,
          nextAttempt: Date.now(),
          status: "pending",
        };
        
        // Update recipient if requested
        if (validatedOptions?.updateRecipient && validatedOptions?.newRecipient) {
          if (newItem.options.type === "raw") {
            newItem.options.data.to = validatedOptions.newRecipient;
          } else {
            newItem.options.data.to = validatedOptions.newRecipient;
          }
        }
        
        // Add to queue
        this.queue.push(newItem);
        
        // Save queue if persistence is enabled
        if (this.options.persistenceKey) {
          this.persistQueue();
        }
        
        // Return result
        return {
          success: true,
          messageId: newItem.id,
          timestamp: new Date().toISOString(),
          provider: "queue",
          recipient: typeof validatedOptions?.newRecipient === "string" 
            ? validatedOptions.newRecipient 
            : validatedOptions?.newRecipient?.email || "unknown",
          subject: "Resent Email",
          status: "queued",
        };
      }
      
      // If the email is pending or processing, just return its status
      return {
        success: true,
        messageId: queueItem.id,
        timestamp: new Date().toISOString(),
        provider: "queue",
        recipient: "unknown", // We don't have easy access to the recipient here
        subject: "Queued Email",
        status: queueItem.status,
      };
    } catch (error) {
      this.logger?.error("Failed to resend email", error as Error);
      throw error;
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<LocalEmailStatus> {
    try {
      // Find the email in the queue
      const queueItem = this.queue.find(item => item.id === emailId);
      
      if (!queueItem) {
        // If not in the queue, try to get status from the underlying email service
        return await this.emailService.getEmailStatus(emailId);
      }
      
      // Map queue status to email status
      let status: LocalEmailStatus["status"];
      switch (queueItem.status) {
        case "pending":
          status = queueItem.scheduledFor > Date.now() ? "scheduled" : "queued";
          break;
        case "processing":
          status = "sending";
          break;
        case "completed":
          status = "sent";
          break;
        case "failed":
          status = "failed";
          break;
        case "cancelled":
          status = "cancelled";
          break;
        default:
          status = "queued";
      }
      
      // Extract recipient and subject from options
      let recipient = "unknown";
      let subject = "Unknown";
      
      if (queueItem.options.type === "raw") {
        const to = queueItem.options.data.to;
        recipient = this.getRecipientEmail(to);
        subject = queueItem.options.data.subject;
      } else {
        const to = queueItem.options.data.to;
        recipient = this.getRecipientEmail(to);
        subject = queueItem.options.data.subject;
      }
      
      return {
        id: queueItem.id,
        status,
        recipient,
        subject,
        scheduledFor: queueItem.scheduledFor > Date.now() ? new Date(queueItem.scheduledFor).toISOString() : undefined,
        metadata: {
          createdAt: new Date(queueItem.createdAt).toISOString(),
          attempts: queueItem.attempts,
          maxAttempts: queueItem.maxAttempts,
          priority: queueItem.priority,
          tags: queueItem.tags,
        },
      };
    } catch (error) {
      this.logger?.error("Failed to get email status", error as Error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<LocalEmailResult> {
    try {
      // Find the email in the queue
      const queueItemIndex = this.queue.findIndex(item => item.id === emailId);
      
      if (queueItemIndex === -1) {
        // If not in the queue, try to cancel via the underlying email service
        return await this.emailService.cancelEmail(emailId);
      }
      
      const queueItem = this.queue[queueItemIndex];
      
      // Ensure queueItem exists (defensive programming)
      if (!queueItem) {
        throw new Error(`Queue item not found for email ID: ${emailId}`);
      }
      
      // Can only cancel pending emails
      if (queueItem.status !== "pending") {
        throw new Error(`Cannot cancel email with status: ${queueItem.status}`);
      }
      
      // Mark as cancelled
      queueItem.status = "cancelled";
      this.stats.cancelled++;
      
      // Save queue if persistence is enabled
      if (this.options.persistenceKey) {
        this.persistQueue();
      }
      
      // Extract recipient and subject from options
      let recipient = "unknown";
      let subject = "Unknown";
      
      if (queueItem.options.type === "raw") {
        const to = queueItem.options.data.to;
        recipient = this.getRecipientEmail(to);
        subject = queueItem.options.data.subject;
      } else {
        const to = queueItem.options.data.to;
        recipient = this.getRecipientEmail(to);
        subject = queueItem.options.data.subject;
      }
      
      // Return result
      return {
        success: true,
        messageId: queueItem.id,
        timestamp: new Date().toISOString(),
        provider: "queue",
        recipient,
        subject,
        status: "cancelled",
      };
    } catch (error) {
      this.logger?.error("Failed to cancel email", error as Error);
      throw error;
    }
  }
  /**
   * Get health status
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    // Get health of underlying email service
    const emailServiceHealth = await this.emailService.getHealth();
    
    // Calculate queue statistics
    const queueStats = {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === "pending").length,
      processing: this.queue.filter(item => item.status === "processing").length,
      completed: this.queue.filter(item => item.status === "completed").length,
      failed: this.queue.filter(item => item.status === "failed").length,
      cancelled: this.queue.filter(item => item.status === "cancelled").length,
      byPriority: {
        critical: this.queue.filter(item => item.priority === "critical").length,
        high: this.queue.filter(item => item.priority === "high").length,
        medium: this.queue.filter(item => item.priority === "medium").length,
        low: this.queue.filter(item => item.priority === "low").length,
      },
    };
    
    const result: ServiceHealthStatus = {
      status: emailServiceHealth.status,
      details: {
        ...emailServiceHealth.details,
        queue: queueStats,
        stats: this.stats,
        options: this.options,
        domainThrottles: Object.fromEntries(this.domainThrottles),
        provider: this.emailService.serviceName,
      },
    };
    
    if (emailServiceHealth.message !== undefined) {
      result.message = emailServiceHealth.message;
    }
    
    return result;
  }

  /**
   * Process the email queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Update dynamic priorities before processing
      this.updateDynamicPriorities();
      
      // Sort the queue by dynamic priority
      this.sortQueue();
      
      // Process up to batchSize items at once
      const batchSize = Math.min(this.options.batchSize, this.options.maxConcurrent - this.activeCount);
      const itemsToProcess: QueueItem[] = [];
      
      // Find eligible items for processing
      const now = Date.now();
      for (const item of this.queue) {
        if (itemsToProcess.length >= batchSize) break;
        
        if (
          item.status === "pending" &&
          item.scheduledFor <= now &&
          item.nextAttempt <= now
        ) {
          // Check rate limits
          if (!this.rateLimiter.canSend(item.priority)) {
            this.stats.rateDelayed++;
            continue;
          }
          
          // Check timing intervals between emails
          if (!this.canSendWithTiming(item.priority)) {
            this.stats.rateDelayed++;
            continue;
          }
          
          // Check domain throttling if applicable
          if (
            item.recipientDomain &&
            this.domainThrottles.has(item.recipientDomain) &&
            !this.canSendToDomain(item.recipientDomain)
          ) {
            this.stats.domainDelayed++;
            continue;
          }
          
          // Item is eligible for processing
          itemsToProcess.push(item);
          
          // Mark as processing and update counters
          item.status = "processing";
          item.lastAttempt = now;
          this.activeCount++;
          
          // Record rate limit usage
          this.rateLimiter.recordSend(item.priority);
          if (item.recipientDomain) {
            this.recordDomainSend(item.recipientDomain);
          }
        }
      }
      
      // Process selected items in parallel
      if (itemsToProcess.length > 0) {
        // Process items in parallel
        await Promise.allSettled(
          itemsToProcess.map(item => this.processItem(item))
        );
      }
    } finally {
      this.processing = false;
      
      // If there are pending items, schedule the next processing cycle
      if (this.queue.some(item => item.status === "pending")) {
        // Find the next scheduled item
        const nextScheduledItem = this.queue
          .filter(item => item.status === "pending")
          .reduce(
            (earliest, item) => Math.min(earliest, item.scheduledFor, item.nextAttempt),
            Infinity
          );
        
        // Calculate delay until next processing
        const delay = Math.max(0, nextScheduledItem - Date.now());
        
        // If delay is short, process immediately in the next tick
        if (delay < 100) {
          setTimeout(() => this.processQueue(), 0);
        }
        // Otherwise, let the regular interval handle it
      }
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      item.attempts++;
      this.stats.processed++;
      
      let result: LocalEmailResult;

      if (item.type === "raw") {
        result = await this.emailService.sendRawEmail(item.options.data);
      } else {
        result = await this.emailService.sendTemplatedEmail(item.options.data);
      }

      // Update item with result
      item.result = result;
      
      if (result.success) {
        item.status = "completed";
        this.stats.successful++;
        
        // Record timing for this priority level
        this.recordEmailSent(item.priority);
        
        // Log success
        this.logger?.info("Email sent successfully", {
          id: item.id,
          messageId: result.messageId,
          recipient: result.recipient,
          subject: result.subject,
          priority: item.priority,
          timingInterval: this.options.testingMode 
            ? this.options.emailIntervals.testing
            : this.options.emailIntervals[item.priority],
        });
      } else {
        // Check if we should retry
        if (item.attempts < item.maxAttempts) {
          // Calculate next attempt time with exponential backoff
          const delayIndex = Math.min(item.attempts - 1, this.options.retryDelays.length - 1);
          const delay = this.options.retryDelays[delayIndex];
          
          // Ensure delay is defined, fallback to default if not
          const safeDelay = delay !== undefined ? delay : 5000; // 5 second default
          
          item.nextAttempt = Date.now() + safeDelay;
          item.status = "pending";
          this.stats.retried++;
          
          // Log retry
          this.logger?.warn("Email sending failed, will retry", {
            id: item.id,
            attempt: item.attempts,
            maxAttempts: item.maxAttempts,
            nextAttempt: new Date(item.nextAttempt).toISOString(),
            error: result.error,
          });
        } else {
          // Max retries reached
          item.status = "failed";
          item.error = result.error;
          this.stats.failed++;
          
          // Log failure
          this.logger?.error(`Email sending failed permanently for ${item.id} after ${item.attempts} attempts`, 
            new Error(result.error || "Email sending failed permanently"));
        }
      }
    } catch (error) {
      // Handle unexpected errors
      this.logger?.error(`Unexpected error processing email ${item.id}`, 
        error instanceof Error ? error : new Error(typeof error === 'string' ? error : "Unknown error"));
      
      // Check if we should retry
      if (item.attempts < item.maxAttempts) {
        // Calculate next attempt time with exponential backoff
        const delayIndex = Math.min(item.attempts - 1, this.options.retryDelays.length - 1);
        const delay = this.options.retryDelays[delayIndex];
        
        // Ensure delay is defined, fallback to default if not
        const safeDelay = delay !== undefined ? delay : 5000; // 5 second default
        
        item.nextAttempt = Date.now() + safeDelay;
        item.status = "pending";
        this.stats.retried++;
      } else {
        // Max retries reached
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "Unknown error";
        this.stats.failed++;
      }
    } finally {
      // Decrement active count
      this.activeCount--;
      
      // Save queue if persistence is enabled
      if (this.options.persistenceKey) {
        this.persistQueue();
      }
    }
  }
  /**
   * Update dynamic priorities for all pending items
   */
  private updateDynamicPriorities(): void {
    const now = Date.now();
    
    for (const item of this.queue) {
      if (item.status !== "pending") continue;
      
      // Base priority score based on priority level
      let priorityScore = 0;
      switch (item.priority) {
        case "critical": priorityScore = 1000; break;
        case "high": priorityScore = 100; break;
        case "medium": priorityScore = 10; break;
        case "low": priorityScore = 1; break;
      }
      
      // Add boost for retry attempts
      priorityScore += item.attempts * this.options.priorityBoost.retryCount * 10;
      
      // Add boost for wait time (minutes waiting)
      const waitTimeMinutes = (now - item.createdAt) / (60 * 1000);
      priorityScore += waitTimeMinutes * this.options.priorityBoost.waitTime * 10;
      
      // Store the calculated priority
      item.dynamicPriority = priorityScore;
    }
  }

  /**
   * Sort the queue by dynamic priority (highest first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      
      // Then by dynamic priority if available
      if (a.dynamicPriority !== undefined && b.dynamicPriority !== undefined) {
        return b.dynamicPriority - a.dynamicPriority;
      }
      
      // Then by priority level
      const priorityOrder: Record<EmailPriority, number> = {
        critical: 3,
        high: 2,
        medium: 1,
        low: 0,
      };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      // Then by scheduled time
      return a.scheduledFor - b.scheduledFor;
    });
  }

  /**
   * Clean up old completed and failed items
   */
  private cleanupQueue(): void {
    const now = Date.now();
    const maxAge = this.options.maxAge;
    
    // Remove old completed and failed items
    this.queue = this.queue.filter(item => {
      if (item.status === "completed" || item.status === "failed" || item.status === "cancelled") {
        return now - item.createdAt < maxAge;
      }
      return true;
    });
    
    // Clean up idempotency cache
    if (this.idempotencyCache.size > 1000) {
      // Find idempotency keys that are no longer in the queue
      const activeKeys = new Set(
        this.queue
          .filter(item => item.idempotencyKey)
          .map(item => item.idempotencyKey!)
      );
      
      // Remove keys that are no longer active
      for (const key of this.idempotencyCache) {
        if (!activeKeys.has(key)) {
          this.idempotencyCache.delete(key);
        }
      }
    }
    
    // Save queue if persistence is enabled
    if (this.options.persistenceKey) {
      this.persistQueue();
    }
  }

  /**
   * Set a throttle limit for a specific domain
   */
  setDomainThrottle(domain: string, limit: number): void {
    this.domainThrottles.set(domain, limit);
  }

  /**
   * Remove a domain throttle
   */
  removeDomainThrottle(domain: string): void {
    this.domainThrottles.delete(domain);
  }

  /**
   * Check if enough time has passed since the last email of this priority
   */
  private canSendWithTiming(priority: EmailPriority): boolean {
    const now = Date.now();
    const lastSendKey = `lastSend_${priority}`;
    const lastSendTime = this.lastSendTimes.get(lastSendKey) || 0;
    
    // Get the required interval for this priority
    const requiredInterval = this.options.testingMode 
      ? this.options.emailIntervals.testing
      : this.options.emailIntervals[priority];
    
    // Check if enough time has passed
    const timeSinceLastSend = now - lastSendTime;
    const canSend = timeSinceLastSend >= requiredInterval;
    
    if (!canSend) {
      this.logger?.debug(`Timing interval not met for ${priority}: ${timeSinceLastSend}ms < ${requiredInterval}ms`);
    }
    
    return canSend;
  }

  /**
   * Record that an email was sent for timing purposes
   */
  private recordEmailSent(priority: EmailPriority): void {
    const now = Date.now();
    const lastSendKey = `lastSend_${priority}`;
    this.lastSendTimes.set(lastSendKey, now);
    
    this.logger?.debug(`Recorded email sent for ${priority} at ${new Date(now).toISOString()}`);
  }

  /**
   * Get the next allowed send time for a priority
   */
  private getNextAllowedSendTime(priority: EmailPriority): number {
    const lastSendKey = `lastSend_${priority}`;
    const lastSendTime = this.lastSendTimes.get(lastSendKey) || 0;
    
    const requiredInterval = this.options.testingMode 
      ? this.options.emailIntervals.testing
      : this.options.emailIntervals[priority];
    
    return lastSendTime + requiredInterval;
  }

  /**
   * Check if sending is allowed for the given domain
   */
  private canSendToDomain(domain: string): boolean {
    if (!this.domainThrottles.has(domain)) return true;
    
    // Implement a simple token bucket algorithm
    const now = Date.now();
    const lastSendKey = `${domain}_lastSend`;
    const tokensKey = `${domain}_tokens`;
    
    // Get last send time and available tokens
    const lastSend = Number(this.env[lastSendKey] || 0);
    let tokens = Number(this.env[tokensKey] || this.domainThrottles.get(domain));
    
    // Refill tokens based on time elapsed
    const limit = this.domainThrottles.get(domain)!;
    const elapsed = (now - lastSend) / 1000; // seconds
    tokens = Math.min(limit, tokens + elapsed * limit);
    
    // Check if we have at least one token
    if (tokens < 1) return false;
    
    return true;
  }

  /**
   * Record a send for the given domain
   */
  private recordDomainSend(domain: string): void {
    if (!this.domainThrottles.has(domain)) return;
    
    const now = Date.now();
    const lastSendKey = `${domain}_lastSend`;
    const tokensKey = `${domain}_tokens`;
    
    // Get current tokens
    let tokens = Number(this.env[tokensKey] || this.domainThrottles.get(domain));
    
    // Use one token
    tokens = Math.max(0, tokens - 1);
    
    // Update state
    this.env[lastSendKey] = now.toString();
    this.env[tokensKey] = tokens.toString();
  }

  /**
   * Get recipient email from various formats
   */
  private getRecipientEmail(to: any): string {
    if (typeof to === "string") {
      return to;
    } else if (Array.isArray(to)) {
      return typeof to[0] === "string" ? to[0] : to[0].email;
    } else {
      return to.email;
    }
  }

  /**
   * Load queue from persistence
   */
  private loadQueue(): void {
    if (!this.options.persistenceKey) return;
    
    try {
      const persistedQueue = this.env[this.options.persistenceKey];
      if (persistedQueue) {
        const parsed = JSON.parse(persistedQueue);
        this.queue = parsed.map((item: any) => QueueItemSchema.parse(item));
        this.logger?.info(`Loaded ${this.queue.length} items from persisted queue`);
      }
    } catch (error) {
      this.logger?.error("Failed to load persisted queue", error as Error);
    }
  }

  /**
   * Save queue to persistence
   */
  private persistQueue(): void {
    if (!this.options.persistenceKey) return;
    
    try {
      // Only persist pending and processing items
      const queueToSave = this.queue.filter(
        item => item.status === "pending" || item.status === "processing"
      );
      
      this.env[this.options.persistenceKey] = JSON.stringify(queueToSave);
      this.logger?.debug(`Persisted ${queueToSave.length} items to queue`);
    } catch (error) {
      this.logger?.error("Failed to persist queue", error as Error);
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
    byPriority: Record<EmailPriority, number>;
    processingStats: {
      processed: number;
      successful: number;
      failed: number;
      retried: number;
      cancelled: number;
      rateDelayed: number;
      domainDelayed: number;
    };
  } {
    const stats = {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === "pending").length,
      processing: this.queue.filter(item => item.status === "processing").length,
      completed: this.queue.filter(item => item.status === "completed").length,
      failed: this.queue.filter(item => item.status === "failed").length,
      cancelled: this.queue.filter(item => item.status === "cancelled").length,
      byPriority: {
        critical: this.queue.filter(item => item.priority === "critical").length,
        high: this.queue.filter(item => item.priority === "high").length,
        medium: this.queue.filter(item => item.priority === "medium").length,
        low: this.queue.filter(item => item.priority === "low").length,
      },
      processingStats: { ...this.stats },
    };
    
    return stats;
  }
}
