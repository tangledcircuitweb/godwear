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
      <AdminLayout title="User Management" currentPath="/admin/users">
        <div style={{ padding: "2rem 0" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem" 
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1e293b" }}>
              User Management
            </h2>
            <div style={{ 
              fontSize: "0.875rem", 
              color: "#64748b",
              background: "rgba(255, 255, 255, 0.3)",
              padding: "0.5rem 1rem",
              borderRadius: "8px"
            }}>
              Logged in as: <strong>{user.name}</strong>
            </div>
          </div>
          
          <div style={{ 
            background: "rgba(59, 130, 246, 0.1)", 
            border: "1px solid rgba(59, 130, 246, 0.2)", 
            borderRadius: "12px", 
            padding: "2rem", 
            textAlign: "center",
            color: "#1e40af"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              User Management System
            </h3>
            <p style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
              This section will allow you to manage user accounts, permissions, and access levels.
              Features coming soon include user search, role assignment, and account status management.
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "1rem",
              marginTop: "2rem"
            }}>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong>Total Users</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>1,247</span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong>Active Users</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>1,198</span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong>New This Month</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>89</span>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
);
