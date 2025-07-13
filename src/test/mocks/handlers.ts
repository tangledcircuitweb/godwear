import { http, HttpResponse } from 'msw';
import { MOCK_API_RESPONSES } from '../constants';

// MailerSend API handlers
const mailerSendHandlers = [
  // Send email endpoint
  http.post('https://api.mailersend.com/v1/email', async ({ request }) => {
    const body = await request.json() as any;
    
    console.log('📧 Mock MailerSend: Send email request', {
      to: body.to,
      subject: body.subject,
      from: body.from,
    });
    
    // Simulate different responses based on email content
    if (body.to?.[0]?.email?.includes('invalid')) {
      return HttpResponse.json(
        MOCK_API_RESPONSES.MAILERSEND.SEND_ERROR.data,
        { status: MOCK_API_RESPONSES.MAILERSEND.SEND_ERROR.status }
      );
    }
    
    // Simulate rate limiting
    if (body.to?.[0]?.email?.includes('ratelimit')) {
      return HttpResponse.json(
        { message: 'Rate limit exceeded', errors: ['Too many requests'] },
        { status: 429 }
      );
    }
    
    // Success response
    return HttpResponse.json(
      MOCK_API_RESPONSES.MAILERSEND.SEND_SUCCESS.data,
      { status: MOCK_API_RESPONSES.MAILERSEND.SEND_SUCCESS.status }
    );
  }),
  
  // Get email activity
  http.get('https://api.mailersend.com/v1/activity/:messageId', ({ params }) => {
    console.log('📊 Mock MailerSend: Get activity for message', params.messageId);
    
    return HttpResponse.json({
      data: [
        {
          id: params.messageId,
          type: 'sent',
          date: new Date().toISOString(),
          recipient: 'test@godwear.com',
        },
      ],
    });
  }),
  
  // Bulk email endpoint
  http.post('https://api.mailersend.com/v1/bulk-email', async ({ request }) => {
    const body = await request.json() as any;
    
    console.log('📧 Mock MailerSend: Bulk email request', {
      count: body.length || 1,
    });
    
    return HttpResponse.json({
      bulk_email_id: 'bulk-test-123',
      message: 'Bulk email queued successfully',
    });
  }),
];

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

// GitHub OAuth handlers
const githubOAuthHandlers = [
  // Token exchange
  http.post('https://github.com/login/oauth/access_token', async ({ request }) => {
    const body = await request.formData();
    const code = body.get('code');
    
    console.log('🔐 Mock GitHub OAuth: Token exchange', { code });
    
    if (!code || code === 'invalid_code') {
      return HttpResponse.json(
        { error: 'bad_verification_code', error_description: 'The code passed is incorrect or expired.' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(MOCK_API_RESPONSES.GITHUB_OAUTH.TOKEN_SUCCESS);
  }),
  
  // User info
  http.get('https://api.github.com/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    console.log('👤 Mock GitHub OAuth: Get user info', { authHeader });
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { message: 'Requires authentication' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(MOCK_API_RESPONSES.GITHUB_OAUTH.USER_INFO);
  }),
  
  // User emails
  http.get('https://api.github.com/user/emails', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    console.log('📧 Mock GitHub OAuth: Get user emails', { authHeader });
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { message: 'Requires authentication' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json([
      {
        email: 'github@godwear.com',
        primary: true,
        verified: true,
        visibility: 'public',
      },
    ]);
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
  ...mailerSendHandlers,
  ...googleOAuthHandlers,
  ...githubOAuthHandlers,
  ...fallbackHandlers,
];

// Export individual handler groups for selective testing
export {
  mailerSendHandlers,
  googleOAuthHandlers,
  githubOAuthHandlers,
  fallbackHandlers,
};
