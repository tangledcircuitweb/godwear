import type { FC, ReactNode } from "react";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
  currentPath?: string;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ title, children, currentPath = "" }) => {
  const isActive = (path: string) => currentPath === path ? "active" : "";

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
          }

          .nav-link:hover, .nav-link.active {
            background: rgba(255, 255, 255, 0.4);
            color: #1e293b;
            transform: translateX(5px);
          }

          .nav-link.active {
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.3);
          }

          .nav-icon {
            margin-right: 0.75rem;
            font-size: 1.2rem;
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

          .header h1 {
            font-size: 2rem;
            font-weight: 600;
            color: #1e293b;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
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

          @media (max-width: 768px) {
            .sidebar {
              width: 100%;
              height: auto;
              position: relative;
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
          }
        `}} />
      </head>
      <body>
        <div className="admin-container">
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
          </aside>

          <main className="main-content">
            <header className="header">
              <h1>{title}</h1>
              <div className="user-info">
                <div className="user-avatar">A</div>
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
