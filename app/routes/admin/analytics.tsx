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
      <AdminLayout title="Analytics" currentPath="/admin/analytics">
        <div style={{ padding: "2rem 0" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem" 
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1e293b" }}>
              Analytics Dashboard
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
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid rgba(16, 185, 129, 0.2)", 
            borderRadius: "12px", 
            padding: "2rem", 
            textAlign: "center",
            color: "#065f46"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Advanced Analytics
            </h3>
            <p style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Comprehensive analytics dashboard with detailed metrics, performance tracking, 
              and business intelligence insights for GodWear operations.
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
                <strong>Page Views</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>45,231</span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong>Conversion Rate</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>3.2%</span>
              </div>
              <div style={{ 
                background: "rgba(255, 255, 255, 0.3)", 
                padding: "1rem", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.4)"
              }}>
                <strong>Revenue</strong><br />
                <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>$12,847</span>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
);
