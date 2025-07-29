import type { FC, ReactNode } from "react";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
  currentPath?: string;
  user?: {
    name: string;
    email: string;
    picture?: string;
  };
  showBreadcrumbs?: boolean;
  actions?: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ 
  title, 
  children, 
  currentPath = "",
  user,
  showBreadcrumbs = true,
  actions
}) => {
  const isActive = (path: string) => currentPath === path ? "active" : "";

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (!showBreadcrumbs || !currentPath) return null;
    
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Admin', path: '/admin' }
    ];
    
    if (pathSegments.length > 1) {
      const section = pathSegments[1];
      const sectionLabels: Record<string, string> = {
        'email-dashboard': 'Email Dashboard',
        'users': 'User Management',
        'analytics': 'Analytics',
        'settings': 'Settings'
      };
      
      if (sectionLabels[section]) {
        breadcrumbs.push({ label: sectionLabels[section], path: currentPath });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - GodWear Admin</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
            min-height: 100vh;
            color: #1e293b;
          }

          body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(192, 192, 192, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
            animation: float 20s ease-in-out infinite;
            z-index: -1;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
          }

          .admin-container {
            display: flex;
            min-height: 100vh;
          }

          .sidebar {
            width: 280px;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            padding: 2rem;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            z-index: 100;
          }

          .sidebar::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(180deg, transparent, rgba(255, 215, 0, 0.3), transparent);
          }

          .logo {
            font-family: 'Playfair Display', serif;
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #c0c0c0 50%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 2rem;
            text-align: center;
          }

          .nav-menu {
            list-style: none;
            margin-bottom: 2rem;
          }

          .nav-item {
            margin-bottom: 0.5rem;
          }

          .nav-link {
            display: flex;
            align-items: center;
            padding: 1rem;
            color: #475569;
            text-decoration: none;
            border-radius: 12px;
            transition: all 0.3s ease;
            font-weight: 500;
            position: relative;
          }

          .nav-link:hover {
            background: rgba(255, 255, 255, 0.4);
            color: #1e293b;
            transform: translateX(5px);
          }

          .nav-link.active {
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.3);
            color: #1e293b;
            transform: translateX(5px);
          }

          .nav-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            background: linear-gradient(135deg, #ffd700 0%, #f59e0b 100%);
            border-radius: 0 2px 2px 0;
          }

          .nav-icon {
            margin-right: 0.75rem;
            font-size: 1.2rem;
          }

          .sidebar-footer {
            position: absolute;
            bottom: 2rem;
            left: 2rem;
            right: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            text-align: center;
            font-size: 0.75rem;
            color: #64748b;
          }

          .main-content {
            flex: 1;
            margin-left: 280px;
            padding: 2rem;
            min-height: 100vh;
          }

          .header {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .header-left {
            flex: 1;
          }

          .header h1 {
            font-size: 2rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          .breadcrumbs {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #64748b;
          }

          .breadcrumb-link {
            color: #64748b;
            text-decoration: none;
            transition: color 0.3s ease;
          }

          .breadcrumb-link:hover {
            color: #1e293b;
          }

          .breadcrumb-separator {
            color: #94a3b8;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-right: 1rem;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .user-details {
            text-align: right;
          }

          .user-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 0.875rem;
          }

          .user-email {
            font-size: 0.75rem;
            color: #64748b;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ffd700 0%, #c0c0c0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1e293b;
            font-weight: 600;
            font-size: 1.1rem;
            position: relative;
            overflow: hidden;
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }

          .logout-btn {
            padding: 0.5rem 1rem;
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .logout-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            transform: translateY(-1px);
          }

          .content-area {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            padding: 2rem;
            min-height: 500px;
          }

          .mobile-menu-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 200;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 0.5rem;
            cursor: pointer;
          }

          @media (max-width: 768px) {
            .sidebar {
              width: 100%;
              height: auto;
              position: relative;
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }
            
            .sidebar.mobile-open {
              transform: translateX(0);
              position: fixed;
              z-index: 150;
            }
            
            .main-content {
              margin-left: 0;
            }
            
            .admin-container {
              flex-direction: column;
            }

            .header {
              flex-direction: column;
              gap: 1rem;
              text-align: center;
            }

            .header-left {
              order: 2;
            }

            .user-info {
              order: 1;
            }

            .mobile-menu-toggle {
              display: block;
            }
          }

          /* Loading states */
          .loading {
            opacity: 0.6;
            pointer-events: none;
          }

          /* Notification styles */
          .notification {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 1rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}} />
      </head>
      <body>
        <div className="admin-container">
          <button className="mobile-menu-toggle" onClick={() => {
            const sidebar = document.querySelector('.sidebar');
            sidebar?.classList.toggle('mobile-open');
          }}>
            ☰
          </button>

          <aside className="sidebar">
            <div className="logo">GodWear Admin</div>
            
            <nav>
              <ul className="nav-menu">
                <li className="nav-item">
                  <a href="/admin" className={`nav-link ${isActive("/admin")}`}>
                    <span className="nav-icon">🏠</span>
                    Dashboard
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/admin/email-dashboard" className={`nav-link ${isActive("/admin/email-dashboard")}`}>
                    <span className="nav-icon">📧</span>
                    Email Dashboard
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/admin/users" className={`nav-link ${isActive("/admin/users")}`}>
                    <span className="nav-icon">👥</span>
                    Users
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/admin/analytics" className={`nav-link ${isActive("/admin/analytics")}`}>
                    <span className="nav-icon">📊</span>
                    Analytics
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/admin/settings" className={`nav-link ${isActive("/admin/settings")}`}>
                    <span className="nav-icon">⚙️</span>
                    Settings
                  </a>
                </li>
              </ul>
            </nav>

            <div className="sidebar-footer">
              GodWear Admin v1.0<br />
              © 2024 GodWear
            </div>
          </aside>

          <main className="main-content">
            <header className="header">
              <div className="header-left">
                <h1>{title}</h1>
                {breadcrumbs && (
                  <nav className="breadcrumbs">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={index}>
                        {index > 0 && <span className="breadcrumb-separator">›</span>}
                        {index === breadcrumbs.length - 1 ? (
                          <span>{crumb.label}</span>
                        ) : (
                          <a href={crumb.path} className="breadcrumb-link">
                            {crumb.label}
                          </a>
                        )}
                      </span>
                    ))}
                  </nav>
                )}
              </div>

              {actions && (
                <div className="header-actions">
                  {actions}
                </div>
              )}

              <div className="user-info">
                {user && (
                  <>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-avatar">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </>
                )}
                <a href="/api/auth/logout" className="logout-btn">Logout</a>
              </div>
            </header>

            <div className="content-area">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
};
