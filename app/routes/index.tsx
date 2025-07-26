import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GodWear - Coming Soon | Christian Apparel & Faith-Based Clothing</title>
        <meta name="description" content="GodWear - Premium Christian apparel and faith-based clothing coming soon. Wear your faith with style and purpose." />
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
            overflow-x: hidden;
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

          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
          }

          .main-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 24px;
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            position: relative;
            overflow: hidden;
          }

          .main-card::before {
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
            font-size: 3.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #c0c0c0 50%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .tagline {
            font-size: 1.25rem;
            color: #475569;
            margin-bottom: 2rem;
            font-weight: 500;
            line-height: 1.6;
          }

          .verse-card {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 16px;
            padding: 2rem;
            margin: 2rem 0;
            position: relative;
          }

          .verse-text {
            font-style: italic;
            font-size: 1.1rem;
            color: #334155;
            margin-bottom: 1rem;
            line-height: 1.7;
          }

          .verse-reference {
            font-weight: 600;
            color: #ffd700;
            font-size: 0.95rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }

          .coming-soon {
            font-size: 2rem;
            font-weight: 600;
            color: #1e293b;
            margin: 2rem 0 1rem 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .description {
            color: #64748b;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
          }

          .notify-form {
            display: flex;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
            justify-content: center;
          }

          .email-input {
            flex: 1;
            min-width: 250px;
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

          .email-input::placeholder {
            color: #94a3b8;
          }

          .email-input:focus {
            border-color: rgba(255, 215, 0, 0.5);
            box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
            background: rgba(255, 255, 255, 0.3);
          }

          .notify-btn {
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
            min-width: 140px;
          }

          .notify-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
            background: linear-gradient(135deg, #f59e0b 0%, #ffd700 100%);
          }

          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 3rem 0;
          }

          .feature {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
          }

          .feature:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }

          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            display: block;
          }

          .feature-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }

          .feature-desc {
            color: #64748b;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          .social-links {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
          }

          .social-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            color: #475569;
            text-decoration: none;
            font-size: 1.5rem;
            transition: all 0.3s ease;
          }

          .social-link:hover {
            transform: translateY(-3px);
            background: rgba(255, 215, 0, 0.2);
            color: #1e293b;
            box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);
          }

          .footer-text {
            margin-top: 2rem;
            color: #94a3b8;
            font-size: 0.9rem;
          }

          @media (max-width: 768px) {
            .container { padding: 1rem; }
            .main-card { padding: 2rem; }
            .logo { font-size: 2.5rem; }
            .coming-soon { font-size: 1.5rem; }
            .notify-form { flex-direction: column; align-items: stretch; }
            .email-input { min-width: auto; }
            .features { grid-template-columns: 1fr; }
          }

          @media (max-width: 480px) {
            .logo { font-size: 2rem; }
            .tagline { font-size: 1.1rem; }
            .verse-card { padding: 1.5rem; }
            .verse-text { font-size: 1rem; }
          }
        `}} />
      </head>
      <body>
        <div className="container">
          <div className="main-card">
            <h1 className="logo">GodWear</h1>
            <p className="tagline">Premium Christian Apparel & Faith-Based Clothing</p>
            
            <div className="verse-card">
              <p className="verse-text">
                "Therefore put on the full armor of God, so that when the day of evil comes, 
                you may be able to stand your ground, and after you have done everything, to stand."
              </p>
              <p className="verse-reference">— Ephesians 6:13</p>
            </div>

            <h2 className="coming-soon">Coming Soon</h2>
            <p className="description">
              We're crafting something beautiful for the body of Christ. 
              Premium apparel that lets you wear your faith with style, purpose, and pride.
            </p>

            <form className="notify-form" action="#" method="post">
              <input 
                type="email" 
                className="email-input" 
                placeholder="Enter your email for early access"
                required
              />
              <button type="submit" className="notify-btn">Notify Me</button>
            </form>

            <div className="features">
              <div className="feature">
                <span className="feature-icon">✝️</span>
                <h3 className="feature-title">Faith-Centered</h3>
                <p className="feature-desc">Every design rooted in biblical truth and Christian values</p>
              </div>
              <div className="feature">
                <span className="feature-icon">👕</span>
                <h3 className="feature-title">Premium Quality</h3>
                <p className="feature-desc">Carefully crafted apparel with attention to every detail</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🌟</span>
                <h3 className="feature-title">Purposeful Design</h3>
                <p className="feature-desc">Clothing that sparks conversations and shares the Gospel</p>
              </div>
            </div>

            <div className="social-links">
              <a href="#" className="social-link" title="Facebook">📘</a>
              <a href="#" className="social-link" title="Instagram">📷</a>
              <a href="#" className="social-link" title="Twitter">🐦</a>
              <a href="#" className="social-link" title="YouTube">📺</a>
            </div>

            <p className="footer-text">
              Built with ❤️ for the Kingdom | © 2024 GodWear
            </p>
          </div>
        </div>
      </body>
    </html>
  );
});
