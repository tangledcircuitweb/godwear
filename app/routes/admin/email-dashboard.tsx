import { Hono } from "hono";
import { html } from "hono/html";
import type { CloudflareBindings } from "../../lib/zod-utils";

// ============================================================================
// EMAIL DASHBOARD - HonoX SERVER-SIDE RENDERED COMPONENT
// ============================================================================

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Email Dashboard Route Handler
 * Server-side rendered dashboard for email analytics and management
 */
app.get("/admin/email-dashboard", async (c) => {
  try {
    // Get email analytics data (mock data for now)
    const emailStats = {
      totalSent: 12543,
      deliveryRate: 98.2,
      openRate: 24.5,
      clickRate: 3.8,
      bounceRate: 1.8,
      unsubscribeRate: 0.3,
    };

    const recentEmails = [
      {
        id: "email_001",
        subject: "Welcome to GodWear",
        recipient: "user@example.com",
        status: "delivered",
        sentAt: "2024-01-15T10:30:00Z",
        template: "welcome",
      },
      {
        id: "email_002", 
        subject: "Your Order Confirmation",
        recipient: "customer@example.com",
        status: "opened",
        sentAt: "2024-01-15T09:15:00Z",
        template: "order-confirmation",
      },
    ];

    const queueStats = {
      pending: 45,
      processing: 3,
      completed: 1250,
      failed: 12,
    };

    // Render the dashboard HTML
    return c.html(html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Dashboard - GodWear Admin</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }
            
            .header {
              margin-bottom: 2rem;
            }
            
            .header h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 0.5rem;
            }
            
            .header p {
              color: #64748b;
              font-size: 1rem;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1.5rem;
              margin-bottom: 2rem;
            }
            
            .metric-card {
              background: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            
            .metric-card h3 {
              font-size: 0.875rem;
              font-weight: 500;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 0.5rem;
            }
            
            .metric-card .value {
              font-size: 2rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 0.25rem;
            }
            
            .metric-card .change {
              font-size: 0.875rem;
              font-weight: 500;
            }
            
            .change.positive {
              color: #059669;
            }
            
            .change.negative {
              color: #dc2626;
            }
            
            .dashboard-grid {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 2rem;
              margin-bottom: 2rem;
            }
            
            .panel {
              background: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            
            .panel h2 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 1rem;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .table th,
            .table td {
              text-align: left;
              padding: 0.75rem;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .table th {
              font-weight: 600;
              color: #374151;
              background-color: #f9fafb;
              font-size: 0.875rem;
            }
            
            .table td {
              font-size: 0.875rem;
              color: #6b7280;
            }
            
            .status {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .status.delivered {
              background-color: #d1fae5;
              color: #065f46;
            }
            
            .status.opened {
              background-color: #dbeafe;
              color: #1e40af;
            }
            
            .status.pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            
            .status.failed {
              background-color: #fee2e2;
              color: #991b1b;
            }
            
            .queue-stats {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }
            
            .queue-stat {
              text-align: center;
              padding: 1rem;
              background-color: #f8fafc;
              border-radius: 6px;
            }
            
            .queue-stat .number {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 0.25rem;
            }
            
            .queue-stat .label {
              font-size: 0.875rem;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .chart-placeholder {
              height: 200px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 500;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Dashboard</h1>
              <p>Monitor email performance, queue status, and analytics</p>
            </div>
            
            <!-- Key Metrics -->
            <div class="metrics-grid">
              <div class="metric-card">
                <h3>Total Sent</h3>
                <div class="value">${emailStats.totalSent.toLocaleString()}</div>
                <div class="change positive">+12% from last month</div>
              </div>
              
              <div class="metric-card">
                <h3>Delivery Rate</h3>
                <div class="value">${emailStats.deliveryRate}%</div>
                <div class="change positive">+0.3% from last month</div>
              </div>
              
              <div class="metric-card">
                <h3>Open Rate</h3>
                <div class="value">${emailStats.openRate}%</div>
                <div class="change positive">+1.2% from last month</div>
              </div>
              
              <div class="metric-card">
                <h3>Click Rate</h3>
                <div class="value">${emailStats.clickRate}%</div>
                <div class="change negative">-0.1% from last month</div>
              </div>
              
              <div class="metric-card">
                <h3>Bounce Rate</h3>
                <div class="value">${emailStats.bounceRate}%</div>
                <div class="change positive">-0.2% from last month</div>
              </div>
              
              <div class="metric-card">
                <h3>Unsubscribe Rate</h3>
                <div class="value">${emailStats.unsubscribeRate}%</div>
                <div class="change positive">-0.1% from last month</div>
              </div>
            </div>
            
            <!-- Dashboard Panels -->
            <div class="dashboard-grid">
              <!-- Recent Emails -->
              <div class="panel">
                <h2>Recent Emails</h2>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Template</th>
                      <th>Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentEmails.map(email => html`
                      <tr>
                        <td>${email.subject}</td>
                        <td>${email.recipient}</td>
                        <td><span class="status ${email.status}">${email.status}</span></td>
                        <td>${email.template}</td>
                        <td>${new Date(email.sentAt).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <!-- Queue Status -->
              <div class="panel">
                <h2>Queue Status</h2>
                <div class="queue-stats">
                  <div class="queue-stat">
                    <div class="number">${queueStats.pending}</div>
                    <div class="label">Pending</div>
                  </div>
                  <div class="queue-stat">
                    <div class="number">${queueStats.processing}</div>
                    <div class="label">Processing</div>
                  </div>
                  <div class="queue-stat">
                    <div class="number">${queueStats.completed}</div>
                    <div class="label">Completed</div>
                  </div>
                  <div class="queue-stat">
                    <div class="number">${queueStats.failed}</div>
                    <div class="label">Failed</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Performance Chart -->
            <div class="panel">
              <h2>Email Performance Trends</h2>
              <div class="chart-placeholder">
                📊 Email Performance Chart (Server-Side Rendered)
              </div>
              <p style="color: #64748b; font-size: 0.875rem;">
                Chart shows email delivery, open, and click rates over the past 30 days.
                Server-side rendered visualization compatible with HonoX.
              </p>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Email dashboard error:", error);
    return c.html(html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Email Dashboard</title>
        </head>
        <body>
          <div style="padding: 2rem; text-align: center;">
            <h1>Dashboard Error</h1>
            <p>Unable to load email dashboard. Please try again later.</p>
          </div>
        </body>
      </html>
    `);
  }
});

export default app;
