import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../../worker-configuration';

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
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

// Generate JWT token for session management
async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

app.get('/', async (c) => {
  try {
    // Check for required environment variables
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.JWT_SECRET) {
      console.error('Missing required environment variables');
      return c.redirect('/?error=configuration_error');
    }

    // Get query parameters
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return c.redirect('/?error=oauth_error&message=' + encodeURIComponent(error));
    }
    
    if (!code || !state) {
      return c.redirect('/?error=missing_parameters');
    }
    
    // Verify state parameter
    const storedState = getCookie(c, 'oauth_state');
    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { stored: storedState, received: state });
      return c.redirect('/?error=state_mismatch');
    }
    
    // Get stored code verifier
    const codeVerifier = getCookie(c, 'oauth_code_verifier');
    if (!codeVerifier) {
      return c.redirect('/?error=missing_code_verifier');
    }
    
    // Clean up OAuth cookies
    deleteCookie(c, 'oauth_state', { path: '/api/auth' });
    deleteCookie(c, 'oauth_code_verifier', { path: '/api/auth' });
    
    // Exchange authorization code for tokens
    const redirectUri = getRedirectUri(c.req.raw, c.env);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return c.redirect('/?error=token_exchange_failed');
    }
    
    const tokens: GoogleTokenResponse = await tokenResponse.json();
    
    // Get user information
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      console.error('Failed to fetch user info');
      return c.redirect('/?error=user_info_failed');
    }
    
    const userInfo: GoogleUserInfo = await userResponse.json();
    
    // Verify email is verified
    if (!userInfo.verified_email) {
      return c.redirect('/?error=email_not_verified');
    }
    
    // Create session payload
    const sessionPayload = {
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };
    
    // Generate JWT session token using environment variable
    const sessionToken = await generateJWT(sessionPayload, c.env.JWT_SECRET);
    
    // Set secure session cookie
    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    // Store user in KV for quick access (optional)
    if (c.env.GODWEAR_KV) {
      await c.env.GODWEAR_KV.put(
        `user:${userInfo.id}`,
        JSON.stringify({
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          lastLogin: new Date().toISOString(),
        }),
        { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
      );
    }
    
    // Send welcome email for new users
    try {
      // Check if this is a new user (you might want to store this in your database)
      const isNewUser = true; // For now, assume all OAuth logins are new users
      
      if (isNewUser && c.env.SENDGRID_API_KEY) {
        // Send welcome email
        const emailResponse = await fetch(`${new URL(c.req.url).origin}/api/email/sendgrid/welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userInfo.email,
            name: userInfo.given_name || userInfo.name,
          }),
        });
        
        if (emailResponse.ok) {
          console.log('Welcome email sent to:', userInfo.email);
        } else {
          console.error('Failed to send welcome email to:', userInfo.email);
        }
      }
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail the authentication if email fails
    }

    // Log successful authentication (remove sensitive data in production)
    console.log('User authenticated successfully:', {
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name
    });
    
    // Redirect to success page or dashboard
    return c.redirect('/?auth=success&welcome=' + encodeURIComponent(userInfo.given_name));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect('/?error=callback_failed&message=' + encodeURIComponent(
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'oauth-callback',
    timestamp: new Date().toISOString(),
    hasClientId: !!c.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!c.env.JWT_SECRET
  });
});

export default app;
