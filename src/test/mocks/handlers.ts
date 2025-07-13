import { http, HttpResponse } from 'msw';
import { MOCK_API_RESPONSES } from '../constants';

// Google OAuth handlers
const googleOAuthHandlers = [
  // Token exchange
  http.post('https://oauth2.googleapis.com/token', async ({ request }) => {
    const body = await request.formData();
    const code = body.get('code');
    const grantType = body.get('grant_type');
    
    console.log('🔐 Mock Google OAuth: Token exchange', { code, grantType });
    
    if (!code || code === 'invalid_code') {
      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(MOCK_API_RESPONSES.GOOGLE_OAUTH.TOKEN_SUCCESS);
  }),
  
  // User info
  http.get('https://www.googleapis.com/oauth2/v2/userinfo', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    console.log('👤 Mock Google OAuth: Get user info', { authHeader });
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(MOCK_API_RESPONSES.GOOGLE_OAUTH.USER_INFO);
  }),
];

// Generic error handlers for unhandled requests
const fallbackHandlers = [
  // Catch-all for unhandled external API calls
  http.get('https://api.external-service.com/*', ({ request }) => {
    console.warn('⚠️  Unhandled external API call:', request.url);
    return HttpResponse.json(
      { error: 'Service unavailable in test environment' },
      { status: 503 }
    );
  }),
  
  http.post('https://api.external-service.com/*', ({ request }) => {
    console.warn('⚠️  Unhandled external API call:', request.url);
    return HttpResponse.json(
      { error: 'Service unavailable in test environment' },
      { status: 503 }
    );
  }),
];

// Export all handlers
export const handlers = [
  ...googleOAuthHandlers,
  ...fallbackHandlers,
];

// Export individual handler groups for selective testing
export {
  googleOAuthHandlers,
  fallbackHandlers,
};
