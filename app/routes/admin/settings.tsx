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
      return c.redirect("/admin/login");
    }

    return c.render(
      <AdminLayout title="Settings" currentPath="/admin/settings">
        <div style={{ padding: "2rem 0" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem" 
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1e293b" }}>
              System Settings
            </h2>
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
          
          <div style={{ 
            background: "rgba(168, 85, 247, 0.1)", 
            border: "1px solid rgba(168, 85, 247, 0.2)", 
            borderRadius: "12px", 
            padding: "2rem", 
            textAlign: "center",
            color: "#581c87"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚙️</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              System Configuration
            </h3>
            <p style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Configure system-wide settings, email templates, API keys, and other 
              administrative preferences for the GodWear platform.
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "1rem",
              marginTop: "2rem",
              textAlign: "left"
            }}>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1.5rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>Email Configuration</strong>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  SMTP settings, templates, and delivery options
                </span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1.5rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>API Management</strong>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  API keys, rate limits, and integration settings
                </span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1.5rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>Security Settings</strong>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  Authentication, permissions, and access controls
                </span>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
);
