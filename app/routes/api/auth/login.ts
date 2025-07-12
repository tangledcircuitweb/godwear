import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../../worker-configuration';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Determine environment and redirect URI
function getRedirectUri(request: Request, env: CloudflareBindings): string {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  if (hostname === 'godwear.ca') {
    return `${env.PRODUCTION_DOMAIN || 'https://godwear.ca'}/api/auth/callback`;
  } else if (hostname.includes('godwear.pages.dev')) {
    return `${env.STAGING_DOMAIN || 'https://63e4fecd.godwear.pages.dev'}/api/auth/callback`;
  } else {
    return `${env.DEVELOPMENT_DOMAIN || 'http://localhost:5173'}/api/auth/callback`;
  }
}

app.get('/', async (c) => {
  try {
    // Check for required environment variables
    if (!c.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID environment variable is not set');
      return c.json({ error: 'OAuth configuration error' }, 500);
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    
    // Get appropriate redirect URI based on environment
    const redirectUri = getRedirectUri(c.req.raw, c.env);
    
    // Store PKCE verifier and state in secure cookies
    setCookie(c, 'oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 600, // 10 minutes
      path: '/api/auth'
    });
    
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 600, // 10 minutes
      path: '/api/auth'
    });
    
    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', c.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    // Log for debugging (remove in production)
    console.log('OAuth Login initiated:', {
      redirectUri,
      state: state.substring(0, 8) + '...',
      codeChallenge: codeChallenge.substring(0, 8) + '...'
    });
    
    // Redirect to Google OAuth
    return c.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('OAuth login error:', error);
    return c.json({
      error: 'Failed to initiate OAuth login',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'oauth-login',
    timestamp: new Date().toISOString(),
    hasClientId: !!c.env.GOOGLE_CLIENT_ID
  });
});

export default app;
