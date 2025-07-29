import { createRoute } from "honox/factory";
import { z } from "zod";
import { requireAdmin, getAuthenticatedUser } from "../../middleware/auth-middleware";
import { AdminLayout } from "../../components/admin/AdminLayout";

// ============================================================================
// LOCAL SCHEMAS - AI-First approach with file-local definitions
// ============================================================================

/**
 * Email Statistics Schema - Local definition
 */
const EmailStatsSchema = z.object({
  totalSent: z.number(),
  deliveryRate: z.number(),
  openRate: z.number(),
  clickRate: z.number(),
  bounceRate: z.number(),
  unsubscribeRate: z.number(),
});

type EmailStats = z.infer<typeof EmailStatsSchema>;

/**
 * Recent Email Schema - Local definition
 */
const RecentEmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  recipient: z.string().email(),
  status: z.enum(["delivered", "opened", "clicked", "bounced", "failed", "pending"]),
  sentAt: z.string(),
  template: z.string(),
});

type RecentEmail = z.infer<typeof RecentEmailSchema>;

/**
 * Queue Statistics Schema - Local definition
 */
const QueueStatsSchema = z.object({
  pending: z.number(),
  processing: z.number(),
  completed: z.number(),
  failed: z.number(),
});

type QueueStats = z.infer<typeof QueueStatsSchema>;

/**
 * Email Template Schema - Local definition
 */
const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["transactional", "marketing", "account", "security", "orders"]),
});

type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

/**
 * Compose Email Schema - Local definition for form validation
 */
const ComposeEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1, "Subject is required"),
  template: z.string().min(1, "Template is required"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  sendAt: z.string().optional(), // For scheduled sending
});

type ComposeEmail = z.infer<typeof ComposeEmailSchema>;

// ============================================================================
// MOCK DATA FUNCTIONS - Self-contained data generation
// ============================================================================

/**
 * Get email statistics (mock data for now)
 * In production, this would fetch from database/analytics service
 */
function getEmailStatistics(): EmailStats {
  return EmailStatsSchema.parse({
    totalSent: 12543,
    deliveryRate: 98.2,
    openRate: 24.5,
    clickRate: 3.8,
    bounceRate: 1.8,
    unsubscribeRate: 0.3,
  });
}

/**
 * Get recent emails (mock data for now)
 * In production, this would fetch from database
 */
function getRecentEmails(): RecentEmail[] {
  const mockEmails = [
    {
      id: "email_001",
      subject: "Welcome to GodWear - Your Faith Journey Begins",
      recipient: "user@example.com",
      status: "delivered" as const,
      sentAt: "2024-01-15T10:30:00Z",
      template: "welcome",
    },
    {
      id: "email_002", 
      subject: "Your Order Confirmation - Armor of God Collection",
      recipient: "customer@example.com",
      status: "opened" as const,
      sentAt: "2024-01-15T09:15:00Z",
      template: "order-confirmation",
    },
    {
      id: "email_003",
      subject: "New Arrival: Faith-Inspired Apparel",
      recipient: "subscriber@example.com",
      status: "clicked" as const,
      sentAt: "2024-01-15T08:45:00Z",
      template: "newsletter",
    },
    {
      id: "email_004",
      subject: "Your Cart is Waiting - Complete Your Purchase",
      recipient: "shopper@example.com",
      status: "pending" as const,
      sentAt: "2024-01-15T08:00:00Z",
      template: "cart-abandonment",
    },
  ];

  return mockEmails.map(email => RecentEmailSchema.parse(email));
}

/**
 * Get queue statistics (mock data for now)
 * In production, this would fetch from queue service
 */
function getQueueStatistics(): QueueStats {
  return QueueStatsSchema.parse({
    pending: 45,
    processing: 3,
    completed: 1250,
    failed: 12,
  });
}

/**
 * Get available email templates
 * In production, this would fetch from template service
 */
function getEmailTemplates(): EmailTemplate[] {
  const mockTemplates = [
    {
      id: "welcome",
      name: "Welcome Email",
      description: "Welcome new users to GodWear",
      category: "account" as const,
    },
    {
      id: "order-confirmation",
      name: "Order Confirmation",
      description: "Confirm customer orders",
      category: "orders" as const,
    },
    {
      id: "newsletter",
      name: "Newsletter",
      description: "Monthly newsletter with new products",
      category: "marketing" as const,
    },
    {
      id: "cart-abandonment",
      name: "Cart Abandonment",
      description: "Remind customers about abandoned carts",
      category: "marketing" as const,
    },
    {
      id: "password-reset",
      name: "Password Reset",
      description: "Password reset instructions",
      category: "security" as const,
    },
    {
      id: "shipping-notification",
      name: "Shipping Notification",
      description: "Notify customers when orders ship",
      category: "orders" as const,
    },
  ];

  return mockTemplates.map(template => EmailTemplateSchema.parse(template));
}

// ============================================================================
// UTILITY FUNCTIONS - Self-contained helpers
// ============================================================================

/**
 * Format status for display
 */
function getStatusColor(status: RecentEmail['status']): string {
  const statusColors = {
    delivered: "#059669", // green
    opened: "#2563eb",    // blue
    clicked: "#7c3aed",   // purple
    bounced: "#dc2626",   // red
    failed: "#dc2626",    // red
    pending: "#d97706",   // orange
  };
  return statusColors[status];
}

/**
 * Get template category color
 */
function getCategoryColor(category: EmailTemplate['category']): string {
  const categoryColors = {
    transactional: "#2563eb", // blue
    marketing: "#7c3aed",     // purple
    account: "#059669",       // green
    security: "#dc2626",      // red
    orders: "#d97706",        // orange
  };
  return categoryColors[category];
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

/**
 * Calculate percentage change (mock calculation)
 */
function getPercentageChange(): { value: number; isPositive: boolean } {
  // Mock data - in production, calculate from historical data
  const changes = [
    { value: 12, isPositive: true },
    { value: -3, isPositive: false },
    { value: 8, isPositive: true },
    { value: 15, isPositive: true },
  ];
  return changes[Math.floor(Math.random() * changes.length)];
}

// ============================================================================
// ROUTE IMPLEMENTATION - AI-First with authentication
// ============================================================================

export default createRoute(
  // Apply admin authentication middleware
  requireAdmin(),
  async (c) => {
    try {
      // Get authenticated user from context (type-safe)
      const user = getAuthenticatedUser(c);
      
      if (!user) {
        return c.redirect("/admin/login");
      }

      // Handle POST request for sending emails
      if (c.req.method === "POST") {
        try {
          const formData = await c.req.formData();
          const emailData = {
            to: formData.get("to")?.toString() || "",
            subject: formData.get("subject")?.toString() || "",
            template: formData.get("template")?.toString() || "",
            priority: formData.get("priority")?.toString() || "medium",
            sendAt: formData.get("sendAt")?.toString() || undefined,
          };

          // Validate email data
          const validatedEmail = ComposeEmailSchema.parse(emailData);

          // TODO: Integrate with actual email service
          // For now, we'll simulate email sending
          console.log("Sending email:", validatedEmail);

          // Redirect with success message
          return c.redirect("/admin/email-dashboard?sent=true");
        } catch (error) {
          console.error("Email sending error:", error);
          return c.redirect("/admin/email-dashboard?error=true");
        }
      }

      // Fetch email dashboard data
      const emailStats = getEmailStatistics();
      const recentEmails = getRecentEmails();
      const queueStats = getQueueStatistics();
      const emailTemplates = getEmailTemplates();

      // Check for success/error messages
      const url = new URL(c.req.url);
      const sent = url.searchParams.get("sent");
      const error = url.searchParams.get("error");

      return c.render(
        <AdminLayout title="Email Dashboard" currentPath="/admin/email-dashboard">
          <div style={{ padding: "0" }}>
            {/* Header with user info */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "2rem" 
            }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                  Email Dashboard
                </h2>
                <p style={{ color: "#64748b" }}>
                  Monitor email performance, send emails, and manage templates
                </p>
              </div>
              <div style={{ 
                fontSize: "0.875rem", 
                color: "#64748b",
                background: "rgba(255, 255, 255, 0.3)",
                padding: "0.5rem 1rem",
                borderRadius: "8px"
              }}>
                Admin: <strong>{user.name}</strong>
              </div>
            </div>

            {/* Success/Error Messages */}
            {sent && (
              <div style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "2rem",
                color: "#166534"
              }}>
                ✅ Email sent successfully!
              </div>
            )}
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "2rem",
                color: "#991b1b"
              }}>
                ❌ Error sending email. Please try again.
              </div>
            )}

            {/* Compose Email Section */}
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem"
            }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                color: "#0f172a", 
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                ✉️ Compose Email
              </h3>

              <form method="POST" style={{ display: "grid", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  {/* Recipient */}
                  <div>
                    <label style={{ 
                      display: "block", 
                      fontSize: "0.875rem", 
                      fontWeight: "500", 
                      color: "#374151", 
                      marginBottom: "0.5rem" 
                    }}>
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      name="to"
                      required
                      placeholder="customer@example.com"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(5px)",
                        fontSize: "0.875rem",
                        color: "#1e293b"
                      }}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ 
                      display: "block", 
                      fontSize: "0.875rem", 
                      fontWeight: "500", 
                      color: "#374151", 
                      marginBottom: "0.5rem" 
                    }}>
                      Priority
                    </label>
                    <select
                      name="priority"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(5px)",
                        fontSize: "0.875rem",
                        color: "#1e293b"
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium" selected>Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "0.875rem", 
                    fontWeight: "500", 
                    color: "#374151", 
                    marginBottom: "0.5rem" 
                  }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    placeholder="Enter email subject"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(5px)",
                      fontSize: "0.875rem",
                      color: "#1e293b"
                    }}
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "0.875rem", 
                    fontWeight: "500", 
                    color: "#374151", 
                    marginBottom: "0.5rem" 
                  }}>
                    Email Template *
                  </label>
                  <select
                    name="template"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(5px)",
                      fontSize: "0.875rem",
                      color: "#1e293b"
                    }}
                  >
                    <option value="">Select a template</option>
                    {emailTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Send Button */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 2rem",
                      background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                      color: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    📤 Send Email
                  </button>
                  
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Email will be queued and sent using the selected template
                  </div>
                </div>
              </form>
            </div>

            {/* Available Templates */}
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem"
            }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                color: "#0f172a", 
                marginBottom: "1.5rem" 
              }}>
                📋 Available Templates
              </h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: "1rem"
              }}>
                {emailTemplates.map((template) => (
                  <div key={template.id} style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: `${getCategoryColor(template.category)}20`,
                        color: getCategoryColor(template.category),
                        border: `1px solid ${getCategoryColor(template.category)}40`
                      }}>
                        {template.category}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.25rem" }}>
                      {template.name}
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              {[
                { label: "Total Sent", value: emailStats.totalSent.toLocaleString(), change: getPercentageChange() },
                { label: "Delivery Rate", value: `${emailStats.deliveryRate}%`, change: getPercentageChange() },
                { label: "Open Rate", value: `${emailStats.openRate}%`, change: getPercentageChange() },
                { label: "Click Rate", value: `${emailStats.clickRate}%`, change: getPercentageChange() },
                { label: "Bounce Rate", value: `${emailStats.bounceRate}%`, change: getPercentageChange() },
                { label: "Unsubscribe Rate", value: `${emailStats.unsubscribeRate}%`, change: getPercentageChange() },
              ].map((metric, index) => (
                <div key={index} style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  textAlign: "center"
                }}>
                  <h3 style={{ 
                    fontSize: "0.875rem", 
                    fontWeight: "500", 
                    color: "#64748b", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    {metric.label}
                  </h3>
                  <div style={{ 
                    fontSize: "2rem", 
                    fontWeight: "700", 
                    color: "#0f172a", 
                    marginBottom: "0.25rem" 
                  }}>
                    {metric.value}
                  </div>
                  <div style={{ 
                    fontSize: "0.875rem", 
                    fontWeight: "500",
                    color: metric.change.isPositive ? "#059669" : "#dc2626"
                  }}>
                    {metric.change.isPositive ? "+" : ""}{metric.change.value}% from last month
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Panels */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "2fr 1fr", 
              gap: "2rem",
              marginBottom: "2rem"
            }}>
              {/* Recent Emails Panel */}
              <div style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "12px",
                padding: "1.5rem"
              }}>
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "600", 
                  color: "#0f172a", 
                  marginBottom: "1rem" 
                }}>
                  📧 Recent Emails
                </h3>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          textAlign: "left", 
                          padding: "0.75rem", 
                          borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "0.875rem"
                        }}>Subject</th>
                        <th style={{ 
                          textAlign: "left", 
                          padding: "0.75rem", 
                          borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "0.875rem"
                        }}>Recipient</th>
                        <th style={{ 
                          textAlign: "left", 
                          padding: "0.75rem", 
                          borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "0.875rem"
                        }}>Status</th>
                        <th style={{ 
                          textAlign: "left", 
                          padding: "0.75rem", 
                          borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "0.875rem"
                        }}>Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEmails.map((email) => (
                        <tr key={email.id}>
                          <td style={{ 
                            padding: "0.75rem", 
                            borderBottom: "1px solid rgba(226, 232, 240, 0.3)",
                            fontSize: "0.875rem",
                            color: "#1e293b",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {email.subject}
                          </td>
                          <td style={{ 
                            padding: "0.75rem", 
                            borderBottom: "1px solid rgba(226, 232, 240, 0.3)",
                            fontSize: "0.875rem",
                            color: "#6b7280"
                          }}>
                            {email.recipient}
                          </td>
                          <td style={{ 
                            padding: "0.75rem", 
                            borderBottom: "1px solid rgba(226, 232, 240, 0.3)"
                          }}>
                            <span style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              backgroundColor: `${getStatusColor(email.status)}20`,
                              color: getStatusColor(email.status),
                              border: `1px solid ${getStatusColor(email.status)}40`
                            }}>
                              {email.status}
                            </span>
                          </td>
                          <td style={{ 
                            padding: "0.75rem", 
                            borderBottom: "1px solid rgba(226, 232, 240, 0.3)",
                            fontSize: "0.875rem",
                            color: "#6b7280"
                          }}>
                            {formatDate(email.sentAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Queue Status Panel */}
              <div style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "12px",
                padding: "1.5rem"
              }}>
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "600", 
                  color: "#0f172a", 
                  marginBottom: "1rem" 
                }}>
                  ⚡ Queue Status
                </h3>
                
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "1rem"
                }}>
                  {[
                    { label: "Pending", value: queueStats.pending, color: "#d97706" },
                    { label: "Processing", value: queueStats.processing, color: "#2563eb" },
                    { label: "Completed", value: queueStats.completed, color: "#059669" },
                    { label: "Failed", value: queueStats.failed, color: "#dc2626" },
                  ].map((stat, index) => (
                    <div key={index} style={{ 
                      textAlign: "center", 
                      padding: "1rem", 
                      backgroundColor: "rgba(248, 250, 252, 0.5)", 
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.4)"
                    }}>
                      <div style={{ 
                        fontSize: "1.5rem", 
                        fontWeight: "700", 
                        color: stat.color, 
                        marginBottom: "0.25rem" 
                      }}>
                        {stat.value}
                      </div>
                      <div style={{ 
                        fontSize: "0.875rem", 
                        color: "#64748b", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.05em" 
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "12px",
              padding: "1.5rem"
            }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                color: "#0f172a", 
                marginBottom: "1rem" 
              }}>
                📈 Email Performance Trends
              </h3>
              
              <div style={{ 
                height: "200px", 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                borderRadius: "6px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "white",
                fontWeight: "500",
                marginBottom: "1rem"
              }}>
                📊 Email Performance Chart (Server-Side Rendered)
              </div>
              
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                Chart shows email delivery, open, and click rates over the past 30 days.
                Server-side rendered visualization compatible with HonoX architecture.
              </p>
            </div>
          </div>
        </AdminLayout>
      );
    } catch (error) {
      console.error("Email dashboard error:", error);
      
      // Error fallback with AdminLayout
      return c.render(
        <AdminLayout title="Email Dashboard - Error" currentPath="/admin/email-dashboard">
          <div style={{ 
            textAlign: "center", 
            padding: "4rem 2rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "12px",
            color: "#991b1b"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
              Dashboard Error
            </h2>
            <p>
              Unable to load email dashboard. Please try again later or contact support.
            </p>
          </div>
        </AdminLayout>
      );
    }
  }
);
