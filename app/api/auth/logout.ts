import { Hono } from 'hono';
import { getCookie, deleteCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../../worker-configuration';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// JWT verification helper (simplified for logout)
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return decodedPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

app.post('/', async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return c.json({ error: 'Configuration error' }, 500);
    }

    // Get session token
    const sessionToken = getCookie(c, 'session');
    
    if (sessionToken) {
      try {
        // Verify and decode token to get user info
        const payload = await verifyJWT(sessionToken, c.env.JWT_SECRET);
        
        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.userId) {
          await c.env.GODWEAR_KV.delete(`user:${payload.userId}`);
        }
        
        console.log('User logged out:', {
          userId: payload.userId,
          email: payload.email,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.log('Invalid session token during logout:', error);
      }
    }
    
    // Clear session cookie
    deleteCookie(c, 'session', { path: '/' });
    
    // Clear any other auth-related cookies
    deleteCookie(c, 'oauth_state', { path: '/api/auth' });
    deleteCookie(c, 'oauth_code_verifier', { path: '/api/auth' });
    
    return c.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      error: 'Logout failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET endpoint for logout (for simple links)
app.get('/', async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return c.redirect('/?error=configuration_error');
    }

    // Get session token
    const sessionToken = getCookie(c, 'session');
    
    if (sessionToken) {
      try {
        // Verify and decode token to get user info
        const payload = await verifyJWT(sessionToken, c.env.JWT_SECRET);
        
        // Remove user from KV store
        if (c.env.GODWEAR_KV && payload.userId) {
          await c.env.GODWEAR_KV.delete(`user:${payload.userId}`);
        }
        
        console.log('User logged out via GET:', {
          userId: payload.userId,
          email: payload.email,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.log('Invalid session token during logout:', error);
      }
    }
    
    // Clear session cookie
    deleteCookie(c, 'session', { path: '/' });
    
    // Clear any other auth-related cookies
    deleteCookie(c, 'oauth_state', { path: '/api/auth' });
    deleteCookie(c, 'oauth_code_verifier', { path: '/api/auth' });
    
    // Redirect to home page with logout confirmation
    return c.redirect('/?logout=success');
    
  } catch (error) {
    console.error('Logout error:', error);
    return c.redirect('/?error=logout_failed');
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'oauth-logout',
    timestamp: new Date().toISOString(),
    hasJwtSecret: !!c.env.JWT_SECRET
  });
});

export default app;
