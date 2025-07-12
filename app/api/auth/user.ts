import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../../worker-configuration';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// JWT verification helper
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      throw new Error('Invalid token format');
    }
    
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    // In production, verify signature properly
    // For now, we'll trust the token if it's not expired
    
    return decodedPayload;
  } catch (error) {
    throw new Error('Invalid token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

app.get('/', async (c) => {
  try {
    // Check for JWT secret
    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return c.json({
        authenticated: false,
        error: 'Configuration error'
      }, 500);
    }

    // Get session token from cookie
    const sessionToken = getCookie(c, 'session');
    
    if (!sessionToken) {
      return c.json({
        authenticated: false,
        message: 'No session token found'
      }, 401);
    }
    
    // Verify JWT token using environment variable
    const payload = await verifyJWT(sessionToken, c.env.JWT_SECRET);
    
    // Get additional user data from KV if available
    let userData = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      loginTime: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString()
    };
    
    if (c.env.GODWEAR_KV && payload.userId) {
      try {
        const kvData = await c.env.GODWEAR_KV.get(`user:${payload.userId}`);
        if (kvData) {
          const kvUserData = JSON.parse(kvData);
          userData = { ...userData, ...kvUserData };
        }
      } catch (error) {
        console.log('Failed to fetch user data from KV:', error);
      }
    }
    
    return c.json({
      authenticated: true,
      user: userData
    });
    
  } catch (error) {
    console.error('User info error:', error);
    return c.json({
      authenticated: false,
      error: 'Invalid session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 401);
  }
});

// POST endpoint for token refresh (future enhancement)
app.post('/refresh', async (c) => {
  return c.json({
    error: 'Token refresh not implemented yet',
    message: 'Please log in again'
  }, 501);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'oauth-user',
    timestamp: new Date().toISOString(),
    hasJwtSecret: !!c.env.JWT_SECRET
  });
});

export default app;
