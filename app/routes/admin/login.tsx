import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";

export default createRoute((c) => {
  // If already authenticated, redirect to admin dashboard
  const sessionToken = getCookie(c, "session");
  
  if (sessionToken) {
    return c.redirect("/admin");
  }

  return c.render(
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin Login - GodWear</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
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

          .login-container {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 24px;
            padding: 3rem;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            position: relative;
            overflow: hidden;
          }

          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.5), transparent);
          }

          .logo {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #c0c0c0 50%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
          }

          .subtitle {
            color: #475569;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            font-weight: 500;
          }

          .admin-badge {
            display: inline-block;
            background: rgba(255, 215, 0, 0.2);
            color: #92400e;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 2rem;
            border: 1px solid rgba(255, 215, 0, 0.3);
          }

          .login-form {
            margin-bottom: 2rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }

          .form-label {
            display: block;
            color: #374151;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }

          .form-input {
            width: 100%;
            padding: 1rem 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            font-size: 1rem;
            color: #334155;
            outline: none;
            transition: all 0.3s ease;
          }

          .form-input::placeholder {
            color: #94a3b8;
          }

          .form-input:focus {
            border-color: rgba(255, 215, 0, 0.5);
            box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
            background: rgba(255, 255, 255, 0.3);
          }

          .login-btn {
            width: 100%;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #ffd700 0%, #f59e0b 100%);
            color: #1e293b;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            margin-bottom: 1.5rem;
          }

          .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
          }

          .divider {
            display: flex;
            align-items: center;
            margin: 1.5rem 0;
            color: #94a3b8;
            font-size: 0.875rem;
          }

          .divider::before,
          .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(148, 163, 184, 0.3);
          }

          .divider span {
            padding: 0 1rem;
          }

          .google-btn {
            width: 100%;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.3);
            color: #374151;
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 12px;
            font-weight: 500;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-decoration: none;
          }

          .google-btn:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: translateY(-1px);
          }

          .google-icon {
            width: 20px;
            height: 20px;
          }

          .back-link {
            display: inline-block;
            color: #64748b;
            text-decoration: none;
            font-size: 0.875rem;
            margin-top: 2rem;
            transition: color 0.3s ease;
          }

          .back-link:hover {
            color: #1e293b;
          }

          .security-note {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            padding: 1rem;
            margin-top: 2rem;
            font-size: 0.875rem;
            color: #1e40af;
            text-align: left;
          }

          @media (max-width: 480px) {
            .login-container {
              padding: 2rem;
            }
            
            .logo {
              font-size: 2rem;
            }
          }
        `}} />
      </head>
      <body>
        <div className="login-container">
          <h1 className="logo">GodWear</h1>
          <p className="subtitle">Admin Portal</p>
          
          <div className="admin-badge">
            🔐 Administrator Access Required
          </div>

          <form className="login-form" action="/api/auth/login" method="post">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email"
                name="email"
                className="form-input" 
                placeholder="admin@godwear.ca"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                name="password"
                className="form-input" 
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Sign In to Admin Panel
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <a href="/api/auth/login?provider=google&redirect=/admin" className="google-btn">
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="security-note">
            <strong>🛡️ Security Notice:</strong> Admin access is restricted to authorized personnel only. All login attempts are monitored and logged.
          </div>

          <a href="/" className="back-link">
            ← Back to GodWear
          </a>
        </div>
      </body>
    </html>
  );
});
