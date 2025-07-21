import { z } from "zod";
import { BaseEmailService, EmailResult, RawEmailOptions, TemplatedEmailOptions } from "./email-service";
import { TransactionalEmailService } from "./transactional-email-service";
import type { ServiceDependencies, ServiceHealthStatus } from "../../services/base";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Email priority enum
 */
const EmailPriorityEnum = z.enum(["critical", "high", "medium", "low"]);

/**
 * Queue item schema
 */
const QueueItemSchema = z.object({
  id: z.string(),
  type: z.enum(["raw", "templated"]),
  options: z.union([
    z.object({ type: z.literal("raw"), data: z.any() }),
    z.object({ type: z.literal("templated"), data: z.any() }),
  ]),
  priority: EmailPriorityEnum,
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  nextAttempt: z.number().int().nonnegative(),
  createdAt: z.number().int().nonnegative(),
  scheduledFor: z.number().int().nonnegative(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
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
    low: z.number().int().nonnegative().default(2),      // 2 per second
  }).default({}),
  retryDelays: z.array(z.number().int().nonnegative()).default([1000, 5000, 15000, 60000]),
  persistenceKey: z.string().optional(),
});

/**
 * Enqueue options schema
 */
const EnqueueOptionsSchema = z.object({
  priority: EmailPriorityEnum.default("medium"),
  maxAttempts: z.number().int().positive().default(3),
  scheduledFor: z.union([z.number().int().nonnegative(), z.date()]).optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type EmailPriority = z.infer<typeof EmailPriorityEnum>;
type QueueItem = z.infer<typeof QueueItemSchema>;
type QueueOptions = z.infer<typeof QueueOptionsSchema>;
type EnqueueOptions = z.infer<typeof EnqueueOptionsSchema>;

/**
 * Email queue service for scheduling and rate limiting
 */
export class EmailQueueService extends BaseEmailService {
  readonly serviceName = "email-queue-service";
  private emailService: TransactionalEmailService;
  private queue: QueueItem[] = [];
  private options: QueueOptions;
  private processing = false;
  private activeCount = 0;
  private rateLimitTimers: Record<EmailPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  private persistenceInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the email queue service
   */
  override initialize(dependencies: ServiceDependencies): void {
    super.initialize(dependencies);

    // Parse queue options from environment
    this.options = QueueOptionsSchema.parse({
      maxConcurrent: Number(this.env.EMAIL_QUEUE_MAX_CONCURRENT || 5),
      rateLimit: {
        critical: Number(this.env.EMAIL_QUEUE_RATE_CRITICAL || 0),
        high: Number(this.env.EMAIL_QUEUE_RATE_HIGH || 10),
        medium: Number(this.env.EMAIL_QUEUE_RATE_MEDIUM || 5),
        low: Number(this.env.EMAIL_QUEUE_RATE_LOW || 2),
      },
      retryDelays: this.env.EMAIL_QUEUE_RETRY_DELAYS
        ? JSON.parse(this.env.EMAIL_QUEUE_RETRY_DELAYS)
        : [1000, 5000, 15000, 60000],
      persistenceKey: this.env.EMAIL_QUEUE_PERSISTENCE_KEY,
    });

    // Initialize the email service
    this.emailService = new TransactionalEmailService();
    this.emailService.initialize(dependencies);

    // Load persisted queue if available
    this.loadQueue();

    // Set up persistence interval if configured
    if (this.options.persistenceKey) {
      this.persistenceInterval = setInterval(() => {
        this.persistQueue();
      }, 60000); // Save queue every minute
    }

    // Start processing the queue
    this.processQueue();
  }

  /**
   * Send a raw email (enqueues for processing)
   */
  async sendRawEmail(
    options: RawEmailOptions,
    enqueueOptions?: Partial<EnqueueOptions>
  ): Promise<EmailResult> {
    const opts = EnqueueOptionsSchema.parse({
      ...enqueueOptions,
      priority: enqueueOptions?.priority || "medium",
    });

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
    };

    this.queue.push(queueItem);
    this.sortQueue();

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
      recipient: options.recipient.email,
      subject: options.subject,
    };
  }

  /**
   * Send a templated email (enqueues for processing)
   */
  async sendTemplatedEmail(
    options: TemplatedEmailOptions,
    enqueueOptions?: Partial<EnqueueOptions>
  ): Promise<EmailResult> {
    const opts = EnqueueOptionsSchema.parse({
      ...enqueueOptions,
      priority: enqueueOptions?.priority || "medium",
    });

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
    };

    this.queue.push(queueItem);
    this.sortQueue();

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
      recipient: options.recipient.email,
      templateName: options.templateName,
      subject: options.subject,
    };
  }

  /**
   * Schedule an email for future delivery
   */
  async scheduleEmail(
    options: RawEmailOptions | TemplatedEmailOptions,
    scheduledFor: Date | number,
    enqueueOptions?: Partial<Omit<EnqueueOptions, "scheduledFor">>
  ): Promise<EmailResult> {
    const isRaw = "html" in options && "text" in options;

    if (isRaw) {
      return this.sendRawEmail(options as RawEmailOptions, {
        ...enqueueOptions,
        scheduledFor,
      });
    } else {
      return this.sendTemplatedEmail(options as TemplatedEmailOptions, {
        ...enqueueOptions,
        scheduledFor,
      });
    }
  }

  /**
   * Cancel a scheduled email
   */
  cancelScheduledEmail(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id && item.status === "pending");
    
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Get the status of an email in the queue
   */
  getEmailStatus(id: string): {
    found: boolean;
    status?: string;
    scheduledFor?: Date;
    attempts?: number;
    result?: EmailResult;
  } {
    const item = this.queue.find((item) => item.id === id);
    
    if (!item) {
      return { found: false };
    }
    
    return {
      found: true,
      status: item.status,
      scheduledFor: new Date(item.scheduledFor),
      attempts: item.attempts,
      result: item.result,
    };
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
    byPriority: Record<EmailPriority, number>;
  } {
    const stats = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    };

    for (const item of this.queue) {
      stats[item.status]++;
      stats.byPriority[item.priority]++;
    }

    return stats;
  }

  /**
   * Clear completed and failed items from the queue
   */
  cleanupQueue(olderThan?: number): number {
    const cutoff = olderThan ? Date.now() - olderThan : 0;
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(
      (item) =>
        item.status !== "completed" &&
        item.status !== "failed" ||
        item.createdAt > cutoff
    );
    
    return initialLength - this.queue.length;
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
      // Continue processing while there are items and capacity
      while (this.queue.length > 0 && this.activeCount < this.options.maxConcurrent) {
        // Find the next eligible item
        const now = Date.now();
        const nextItem = this.queue.find(
          (item) =>
            item.status === "pending" &&
            item.scheduledFor <= now &&
            item.nextAttempt <= now &&
            this.canSendWithRateLimit(item.priority)
        );

        if (!nextItem) {
          // No eligible items, break the loop
          break;
        }

        // Update rate limit counter
        this.updateRateLimit(nextItem.priority);

        // Mark as processing and increment active count
        nextItem.status = "processing";
        this.activeCount++;

        // Process the item asynchronously
        this.processItem(nextItem).finally(() => {
          // Decrement active count when done
          this.activeCount--;
          
          // Continue processing if there are more items
          if (this.queue.length > 0 && !this.processing) {
            this.processQueue();
          }
        });
      }
    } finally {
      this.processing = false;
    }

    // If there are pending items but we can't process them yet,
    // schedule the next processing cycle
    if (this.queue.some((item) => item.status === "pending")) {
      const nextScheduledItem = this.queue
        .filter((item) => item.status === "pending")
        .reduce(
          (earliest, item) => Math.min(earliest, item.scheduledFor, item.nextAttempt),
          Infinity
        );

      const delay = Math.max(0, nextScheduledItem - Date.now());
      setTimeout(() => this.processQueue(), delay);
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      item.attempts++;

      let result: EmailResult;

      if (item.type === "raw") {
        result = await this.emailService.sendRawEmail(item.options.data);
      } else {
        result = await this.emailService.sendTemplatedEmail(item.options.data);
      }

      if (result.success) {
        // Success - mark as completed
        item.status = "completed";
        item.result = result;
      } else {
        // Failed - retry if attempts remain
        if (item.attempts < item.maxAttempts) {
          const delay = this.options.retryDelays[item.attempts - 1] || this.options.retryDelays[this.options.retryDelays.length - 1];
          item.status = "pending";
          item.nextAttempt = Date.now() + delay;
          item.error = result.error;
        } else {
          // Max attempts reached - mark as failed
          item.status = "failed";
          item.result = result;
          item.error = result.error;
          
          this.logger?.error("Email sending failed after maximum attempts", {
            id: item.id,
            attempts: item.attempts,
            error: result.error,
            recipient: this.getRecipientFromItem(item),
          });
        }
      }
    } catch (error) {
      // Unexpected error - retry if attempts remain
      if (item.attempts < item.maxAttempts) {
        const delay = this.options.retryDelays[item.attempts - 1] || this.options.retryDelays[this.options.retryDelays.length - 1];
        item.status = "pending";
        item.nextAttempt = Date.now() + delay;
        item.error = error instanceof Error ? error.message : "Unknown error";
      } else {
        // Max attempts reached - mark as failed
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "Unknown error";
        
        this.logger?.error("Email sending failed with exception", {
          id: item.id,
          attempts: item.attempts,
          error: item.error,
          recipient: this.getRecipientFromItem(item),
        });
      }
    }
  }

  /**
   * Check if we can send an email with the current rate limit
   */
  private canSendWithRateLimit(priority: EmailPriority): boolean {
    const limit = this.options.rateLimit[priority];
    
    // No rate limit for this priority
    if (limit === 0) {
      return true;
    }
    
    const now = Date.now();
    const minInterval = 1000 / limit; // Minimum interval in ms
    
    return now - this.rateLimitTimers[priority] >= minInterval;
  }

  /**
   * Update rate limit timer for a priority
   */
  private updateRateLimit(priority: EmailPriority): void {
    this.rateLimitTimers[priority] = Date.now();
  }

  /**
   * Sort the queue by priority and scheduled time
   */
  private sortQueue(): void {
    const priorityValues: Record<EmailPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    this.queue.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      
      // Then by priority
      const priorityDiff = priorityValues[a.priority] - priorityValues[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by scheduled time
      return a.scheduledFor - b.scheduledFor;
    });
  }

  /**
   * Persist the queue to storage
   */
  private persistQueue(): void {
    if (!this.options.persistenceKey) {
      return;
    }

    try {
      // Only persist pending items
      const pendingItems = this.queue.filter((item) => item.status === "pending");
      
      // Store in KV if available
      if (this.env.EMAIL_QUEUE_KV) {
        this.env.EMAIL_QUEUE_KV.put(
          this.options.persistenceKey,
          JSON.stringify(pendingItems)
        );
      } else {
        // Fallback to localStorage in browser environments
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(
            this.options.persistenceKey,
            JSON.stringify(pendingItems)
          );
        }
      }
    } catch (error) {
      this.logger?.error("Failed to persist email queue", error as Error);
    }
  }

  /**
   * Load the queue from storage
   */
  private async loadQueue(): Promise<void> {
    if (!this.options.persistenceKey) {
      return;
    }

    try {
      let queueData: string | null = null;
      
      // Try to load from KV if available
      if (this.env.EMAIL_QUEUE_KV) {
        queueData = await this.env.EMAIL_QUEUE_KV.get(this.options.persistenceKey);
      } else {
        // Fallback to localStorage in browser environments
        if (typeof localStorage !== "undefined") {
          queueData = localStorage.getItem(this.options.persistenceKey);
        }
      }
      
      if (queueData) {
        const parsedItems = JSON.parse(queueData);
        
        // Validate and add items to the queue
        for (const item of parsedItems) {
          try {
            const validItem = QueueItemSchema.parse(item);
            this.queue.push(validItem);
          } catch (error) {
            this.logger?.warn("Invalid queue item found in persistence", {
              item,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        
        this.sortQueue();
      }
    } catch (error) {
      this.logger?.error("Failed to load email queue", error as Error);
    }
  }

  /**
   * Extract recipient email from a queue item for logging
   */
  private getRecipientFromItem(item: QueueItem): string {
    try {
      if (item.type === "raw") {
        return item.options.data.recipient.email;
      } else {
        return item.options.data.recipient.email;
      }
    } catch {
      return "unknown";
    }
  }

  /**
   * Clean up resources when service is destroyed
   */
  async destroy(): Promise<void> {
    // Clear persistence interval
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
      this.persistenceInterval = null;
    }
    
    // Persist queue one last time
    await this.persistQueue();
  }

  /**
   * Get health status of the email queue service
   */
  async getHealth(): Promise<ServiceHealthStatus> {
    const stats = this.getQueueStats();
    const emailServiceHealth = await this.emailService.getHealth();
    
    return {
      status: emailServiceHealth.status === "healthy" ? "healthy" : "unhealthy",
      message: emailServiceHealth.status === "healthy"
        ? "Email queue service is operational"
        : "Email queue service is degraded",
      details: {
        queueStats: stats,
        activeCount: this.activeCount,
        maxConcurrent: this.options.maxConcurrent,
        emailService: {
          status: emailServiceHealth.status,
          message: emailServiceHealth.message,
        },
      },
    };
  }
}
