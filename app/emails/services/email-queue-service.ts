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
      if (item.status === "completed" || item.status === "failed") {
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
