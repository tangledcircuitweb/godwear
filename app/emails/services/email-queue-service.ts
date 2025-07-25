import { z } from "zod";
import { BaseEmailService } from "./email-service";
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
    low: z.number().int().nonnegative().default(2),     // 2 per second
  }),
  retryDelay: z.number().int().positive().default(5000), // 5 seconds
  maxRetries: z.number().int().nonnegative().default(3),
  batchSize: z.number().int().positive().default(10),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type EmailPriority = z.infer<typeof EmailPriorityEnum>;
export type QueueItem = z.infer<typeof QueueItemSchema>;
export type QueueOptions = z.infer<typeof QueueOptionsSchema>;

/**
 * Email queue service for managing email sending with priorities and rate limiting
 */
export class EmailQueueService extends BaseEmailService {
  override readonly serviceName = "email-queue-service";
  
  private emailService: BaseEmailService;
  private queue: QueueItem[] = [];
  private processing = new Set<string>();
  private options: QueueOptions;
  private rateLimiters = new Map<EmailPriority, { count: number; resetTime: number }>();
  private isProcessing = false;

  constructor(emailService: BaseEmailService) {
    super();
    this.emailService = emailService;
    this.options = QueueOptionsSchema.parse({});
  }

  /**
   * Initialize the queue service
   */
  override initialize(dependencies: ServiceDependencies): void {
    super.initialize(dependencies);
    this.emailService.initialize(dependencies);
    
    // Parse queue options from environment
    this.options = QueueOptionsSchema.parse({
      maxConcurrent: parseInt(dependencies.env.EMAIL_QUEUE_MAX_CONCURRENT || "5"),
      rateLimit: {
        critical: parseInt(dependencies.env.EMAIL_QUEUE_RATE_CRITICAL || "0"),
        high: parseInt(dependencies.env.EMAIL_QUEUE_RATE_HIGH || "10"),
        medium: parseInt(dependencies.env.EMAIL_QUEUE_RATE_MEDIUM || "5"),
        low: parseInt(dependencies.env.EMAIL_QUEUE_RATE_LOW || "2"),
      },
      retryDelay: parseInt(dependencies.env.EMAIL_QUEUE_RETRY_DELAY || "5000"),
      maxRetries: parseInt(dependencies.env.EMAIL_QUEUE_MAX_RETRIES || "3"),
      batchSize: parseInt(dependencies.env.EMAIL_QUEUE_BATCH_SIZE || "10"),
    });
    
    // Start processing queue
    this.startProcessing();
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
      priorityScore += item.attempts * 10;
      
      // Add age boost (older items get higher priority)
      const ageMinutes = (now - item.createdAt) / (1000 * 60);
      priorityScore += ageMinutes * 0.1;
      
      // Store calculated priority
      (item as any).dynamicPriority = priorityScore;
    }
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Process items in the queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      try {
        // Update dynamic priorities
        this.updateDynamicPriorities();
        
        // Get next batch of items to process
        const itemsToProcess = this.getNextBatch();
        
        if (itemsToProcess.length === 0) {
          // No items to process, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Process items concurrently
        const promises = itemsToProcess.map(item => this.processItem(item));
        await Promise.allSettled(promises);
        
      } catch (error) {
        this.logger?.error("Error in queue processing:", error instanceof Error ? error : new Error(String(error)));
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Get next batch of items to process
   */
  private getNextBatch(): QueueItem[] {
    const now = Date.now();
    const availableSlots = this.options.maxConcurrent - this.processing.size;
    
    if (availableSlots <= 0) return [];
    
    // Filter pending items that are ready to be processed
    const readyItems = this.queue
      .filter(item => 
        item.status === "pending" && 
        item.scheduledFor <= now &&
        !this.processing.has(item.id) &&
        this.canSendWithRateLimit(item.priority)
      )
      .sort((a, b) => {
        // Sort by dynamic priority (higher first), then by creation time (older first)
        const priorityDiff = ((b as any).dynamicPriority || 0) - ((a as any).dynamicPriority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt - b.createdAt;
      });
    
    return readyItems.slice(0, Math.min(availableSlots, this.options.batchSize));
  }

  /**
   * Check if we can send an email with the given priority based on rate limits
   */
  private canSendWithRateLimit(priority: EmailPriority): boolean {
    const limit = this.options.rateLimit[priority];
    if (limit === 0) return true; // No limit
    
    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(priority);
    
    if (!rateLimiter || now >= rateLimiter.resetTime) {
      // Reset or initialize rate limiter
      this.rateLimiters.set(priority, { count: 0, resetTime: now + 1000 });
      return true;
    }
    
    return rateLimiter.count < limit;
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    this.processing.add(item.id);
    item.status = "processing";
    
    try {
      // Update rate limiter
      const priority = item.priority;
      const rateLimiter = this.rateLimiters.get(priority);
      if (rateLimiter) {
        rateLimiter.count++;
      }
      
      // Send the email
      let result: LocalEmailResult;
      
      if (item.type === "raw") {
        result = await this.emailService.sendRawEmail(item.options.data);
      } else {
        result = await this.emailService.sendTemplatedEmail(item.options.data);
      }
      
      // Update item with result
      item.result = result;
      item.status = result.success ? "completed" : "failed";
      
      if (!result.success) {
        item.error = result.error;
        
        // Schedule retry if attempts remaining
        if (item.attempts < item.maxAttempts) {
          item.attempts++;
          item.status = "pending";
          item.nextAttempt = Date.now() + this.options.retryDelay * Math.pow(2, item.attempts - 1);
          item.scheduledFor = item.nextAttempt;
        }
      }
      
    } catch (error) {
      // Handle processing error
      item.error = error instanceof Error ? error.message : String(error);
      item.status = "failed";
      
      // Schedule retry if attempts remaining
      if (item.attempts < item.maxAttempts) {
        item.attempts++;
        item.status = "pending";
        item.nextAttempt = Date.now() + this.options.retryDelay * Math.pow(2, item.attempts - 1);
        item.scheduledFor = item.nextAttempt;
      }
      
    } finally {
      this.processing.delete(item.id);
    }
  }

  /**
   * Add email to queue
   */
  private addToQueue(
    type: "raw" | "templated",
    options: LocalRawEmailOptions | LocalTemplatedEmailOptions,
    priority: EmailPriority = "medium",
    scheduledFor?: Date
  ): string {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    const item: QueueItem = {
      id,
      type,
      options: type === "raw" 
        ? { type: "raw", data: options }
        : { type: "templated", data: options },
      priority,
      attempts: 0,
      maxAttempts: this.options.maxRetries,
      nextAttempt: scheduledFor ? scheduledFor.getTime() : now,
      createdAt: now,
      scheduledFor: scheduledFor ? scheduledFor.getTime() : now,
      status: "pending",
    };
    
    this.queue.push(item);
    return id;
  }

  /**
   * Send a raw email (queued)
   */
  async sendRawEmail(options: LocalRawEmailOptions, priority: EmailPriority = "medium"): Promise<LocalEmailResult> {
    const queueId = this.addToQueue("raw", options, priority);
    
    // For immediate processing, we could wait for the result
    // For now, return a pending result
    return {
      success: true,
      messageId: queueId,
      timestamp: new Date().toISOString(),
      provider: this.serviceName,
      recipient: options.recipient.email,
      subject: options.subject,
      status: "queued",
    };
  }

  /**
   * Send a templated email (queued)
   */
  async sendTemplatedEmail(options: LocalTemplatedEmailOptions, priority: EmailPriority = "medium"): Promise<LocalEmailResult> {
    const queueId = this.addToQueue("templated", options, priority);
    
    return {
      success: true,
      messageId: queueId,
      timestamp: new Date().toISOString(),
      provider: this.serviceName,
      recipient: options.recipient.email,
      subject: options.subject,
      templateName: options.templateName,
      status: "queued",
    };
  }

  /**
   * Resend an email
   */
  async resendEmail(emailId: string, options?: LocalResendOptions): Promise<LocalEmailResult> {
    return this.emailService.resendEmail(emailId, options);
  }

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<LocalEmailStatus> {
    // Check if it's a queue item
    const queueItem = this.queue.find(item => item.id === emailId);
    
    if (queueItem) {
      return {
        id: emailId,
        status: queueItem.status === "completed" ? "delivered" : 
               queueItem.status === "failed" ? "failed" :
               queueItem.status === "processing" ? "sent" : "queued",
        recipient: "unknown", // Would need to extract from options
        subject: "unknown",   // Would need to extract from options
        metadata: {
          attempts: queueItem.attempts,
          priority: queueItem.priority,
          createdAt: new Date(queueItem.createdAt).toISOString(),
          scheduledFor: new Date(queueItem.scheduledFor).toISOString(),
        },
      };
    }
    
    // If not in the queue, try to get status from the underlying email service
    return await this.emailService.getEmailStatus(emailId);
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<LocalEmailResult> {
    const queueItem = this.queue.find(item => item.id === emailId);
    
    if (queueItem && queueItem.status === "pending") {
      queueItem.status = "cancelled";
      
      return {
        success: true,
        messageId: emailId,
        timestamp: new Date().toISOString(),
        provider: this.serviceName,
        recipient: "unknown",
        subject: "unknown",
        status: "cancelled",
      };
    }
    
    return this.emailService.cancelEmail(emailId);
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    const underlyingHealth = await this.emailService.getHealth();
    
    const queueStats = {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === "pending").length,
      processing: this.processing.size,
      completed: this.queue.filter(item => item.status === "completed").length,
      failed: this.queue.filter(item => item.status === "failed").length,
      cancelled: this.queue.filter(item => item.status === "cancelled").length,
    };
    
    return {
      status: underlyingHealth.status === "healthy" && queueStats.processing < this.options.maxConcurrent ? "healthy" : "degraded",
      message: `Queue service operational. ${queueStats.pending} pending, ${queueStats.processing} processing.`,
      details: {
        underlying: underlyingHealth,
        queue: queueStats,
        options: this.options,
      },
    };
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    this.isProcessing = false;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === "pending").length,
      processing: this.processing.size,
      completed: this.queue.filter(item => item.status === "completed").length,
      failed: this.queue.filter(item => item.status === "failed").length,
      cancelled: this.queue.filter(item => item.status === "cancelled").length,
    };
  }
}
