import { createRoute } from "honox/factory";
import { requireAdmin, getAuthenticatedUser } from "../../middleware/auth-middleware";
import { AdminLayout } from "../../components/admin/AdminLayout";

export default createRoute(
  // Apply admin authentication middleware
  requireAdmin(),
  (c) => {
    // Get authenticated user from context (type-safe)
    const user = getAuthenticatedUser(c);
    
    if (!user) {
      // This shouldn't happen due to middleware, but type safety
      return c.redirect("/admin/login");
    }

    return c.render(
      <AdminLayout 
        title="Dashboard" 
        currentPath="/admin"
        user={user}
        showBreadcrumbs={true}
      >
        <div style={{ padding: "0" }}>
          {/* Welcome Message */}
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            color: "#166534"
          }}>
            <strong>🎉 Welcome back, {user.name}!</strong>
            <br />
            You have admin access to the GodWear management system.
            {user.verifiedEmail && <span> ✅ Email verified</span>}
          </div>

          {/* Quick Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            {[
              { label: "Total Users", value: "1,247", change: "+12%", icon: "👥" },
              { label: "Emails Sent", value: "12,543", change: "+8%", icon: "📧" },
              { label: "Active Sessions", value: "89", change: "+15%", icon: "🔄" },
              { label: "System Health", value: "98.2%", change: "+0.3%", icon: "💚" },
            ].map((stat, index) => (
              <div key={index} style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
                <h3 style={{ 
                  fontSize: "0.875rem", 
                  fontWeight: "500", 
                  color: "#64748b", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.5rem" 
                }}>
                  {stat.label}
                </h3>
                <div style={{ 
                  fontSize: "1.5rem", 
                  fontWeight: "700", 
                  color: "#0f172a", 
                  marginBottom: "0.25rem" 
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: "500",
                  color: "#059669"
                }}>
                  {stat.change} from last month
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem"
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              transition: "all 0.3s ease"
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>📧</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                Email Management
              </h3>
              <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Monitor email campaigns, delivery rates, and analytics
              </p>
              <a href="/admin/email-dashboard" style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                color: "#1e293b",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}>
                View Email Dashboard
              </a>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              transition: "all 0.3s ease"
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>👥</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                User Management
              </h3>
              <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Manage user accounts, permissions, and access levels
              </p>
              <a href="/admin/users" style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                color: "#1e293b",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}>
                Manage Users
              </a>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              transition: "all 0.3s ease"
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>📊</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                Analytics
              </h3>
              <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                View detailed analytics and performance metrics
              </p>
              <a href="/admin/analytics" style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                color: "#1e293b",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}>
                View Analytics
              </a>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              transition: "all 0.3s ease"
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>⚙️</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                System Settings
              </h3>
              <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Configure system settings and preferences
              </p>
              <a href="/admin/settings" style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                color: "#1e293b",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}>
                Open Settings
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "12px",
            padding: "2rem"
          }}>
            <h3 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "600", 
              color: "#0f172a", 
              marginBottom: "1.5rem" 
            }}>
              🕒 Recent Activity
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { action: "Email sent", details: "Welcome email to new user", time: "2 minutes ago", icon: "📧" },
                { action: "User registered", details: "New user account created", time: "5 minutes ago", icon: "👤" },
                { action: "System backup", details: "Automated backup completed", time: "1 hour ago", icon: "💾" },
                { action: "Analytics updated", details: "Daily metrics processed", time: "2 hours ago", icon: "📊" },
              ].map((activity, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}>
                  <div style={{ fontSize: "1.5rem" }}>{activity.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.875rem" }}>
                      {activity.action}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {activity.details}
                    </div>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
);
