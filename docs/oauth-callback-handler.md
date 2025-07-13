# Enhanced OAuth Callback Handler

## Overview

The enhanced OAuth callback handler (`/api/auth/callback`) is a comprehensive implementation that handles OAuth provider responses with enterprise-grade security, database integration, session management, and audit logging.

## Features

### 🔒 Security Features
- **CSRF Protection**: State parameter validation prevents cross-site request forgery attacks
- **Secure Cookie Settings**: HTTP-only, secure, and SameSite cookie configurations
- **IP Address Tracking**: Records client IP addresses for security monitoring
- **User Agent Tracking**: Logs user agent strings for device identification
- **Token Hashing**: Stores hashed tokens in database for security
- **Comprehensive Audit Logging**: Tracks all authentication events and security incidents

### 🗄️ Database Integration
- **Repository Pattern**: Uses the new database repository layer for type-safe operations
- **Session Management**: Creates and tracks user sessions in the database
- **User Management**: Creates new users or updates existing user information
- **Audit Trail**: Comprehensive logging of all authentication events

### 📧 Email Integration
- **Welcome Emails**: Automatically sends welcome emails to new users
- **Error Handling**: Graceful handling of email service failures
- **Audit Logging**: Tracks email sending success and failures

### 🛡️ Error Handling
- **Comprehensive Error Types**: Specific error codes for different failure scenarios
- **Security Event Logging**: All errors are logged for security monitoring
- **Graceful Degradation**: Authentication continues even if non-critical services fail
- **Cookie Cleanup**: Automatic cleanup of cookies on errors

## API Endpoints

### GET /api/auth/callback

Handles OAuth provider callback responses.

#### Query Parameters

**Success Response:**
- `code` (string, required): Authorization code from OAuth provider
- `state` (string, required): State parameter for CSRF protection
- `scope` (string, optional): Granted scopes
- `authuser` (string, optional): User identifier
- `prompt` (string, optional): Prompt parameter

**Error Response:**
- `error` (string, required): OAuth error code
- `error_description` (string, optional): Human-readable error description
- `state` (string, optional): State parameter

#### Headers

- `CF-Connecting-IP`: Client IP address (Cloudflare)
- `X-Forwarded-For`: Client IP address (fallback)
- `User-Agent`: Client user agent string
- `Cookie`: Must contain `oauth_state` cookie for CSRF protection

#### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://example.com/avatar.jpg"
    },
    "isNewUser": true
  },
  "meta": {
    "service": "auth-callback",
    "version": "2.0.0",
    "requestId": "session-uuid",
    "timestamp": "2025-07-13T07:00:00.000Z"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_STATE",
    "message": "Invalid OAuth state parameter - possible CSRF attack",
    "timestamp": "2025-07-13T07:00:00.000Z",
    "service": "auth-callback",
    "details": {
      "securityNote": "This request may be from an unauthorized source"
    }
  }
}
```

#### Set Cookies

On successful authentication:
- `auth_token`: JWT access token (HTTP-only, secure, 24h expiry)
- `session_id`: Session identifier (HTTP-only, secure, 24h expiry)

## Security Implementation

### CSRF Protection

The handler validates the `state` parameter against the stored `oauth_state` cookie:

1. **State Generation**: Generated during login initiation
2. **State Storage**: Stored in HTTP-only cookie with 10-minute expiry
3. **State Validation**: Compared during callback processing
4. **State Cleanup**: Cookie deleted after validation (success or failure)

### Session Management

Sessions are tracked in the database with the following security features:

- **Token Hashing**: Access tokens are hashed using SHA-256 before storage
- **Session Expiry**: 24-hour session lifetime with database tracking
- **IP Tracking**: Session tied to originating IP address
- **User Agent Tracking**: Device identification for security monitoring
- **Active Status**: Sessions can be invalidated server-side

### Audit Logging

All authentication events are logged with the following information:

- **User ID**: Associated user (if available)
- **Action**: Specific action taken (login, registration, error, etc.)
- **Resource Type**: Type of resource accessed (auth, email, etc.)
- **Resource ID**: Specific resource identifier
- **Values**: JSON-encoded event details
- **IP Address**: Client IP address
- **User Agent**: Client user agent string
- **Timestamp**: Automatic timestamp generation

#### Logged Events

- `oauth_error`: OAuth provider errors
- `oauth_state_mismatch`: CSRF protection triggers
- `user_registered`: New user registration
- `user_login`: Existing user login
- `welcome_email_sent`: Successful welcome email
- `welcome_email_failed`: Failed welcome email
- `auth_callback_failed`: General authentication failures

## Database Schema

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values TEXT, -- JSON string
  new_values TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_OAUTH_ERROR` | OAuth provider returned an error | 400 |
| `AUTH_INVALID_STATE` | State parameter validation failed (CSRF) | 400 |
| `AUTH_TOKEN_EXCHANGE_FAILED` | Failed to exchange authorization code | 400 |
| `AUTH_USER_INFO_FAILED` | Failed to fetch user info from provider | 400 |
| `DATABASE_QUERY_ERROR` | Database operation failed | 500 |
| `INTERNAL_SERVER_ERROR` | General server error | 500 |

## Configuration

### Environment Variables

Required environment variables:

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `JWT_SECRET`: Secret key for JWT signing (min 32 characters)
- `NODE_ENV`: Environment (development/staging/production)

Optional environment variables:

- `PRODUCTION_DOMAIN`: Production domain for redirect URI
- `STAGING_DOMAIN`: Staging domain for redirect URI
- `DEVELOPMENT_DOMAIN`: Development domain for redirect URI

### Service Dependencies

The callback handler depends on the following services:

- **AuthService**: OAuth token exchange and JWT generation
- **DatabaseService**: Database operations via repository pattern
- **NotificationService**: Welcome email sending
- **RepositoryRegistry**: Type-safe database repositories

## Testing

### Test Suite

A comprehensive test suite is available in `test-oauth-callback.js`:

```bash
node test-oauth-callback.js
```

### Test Scenarios

1. **Valid Callback**: Tests successful OAuth flow
2. **Invalid State**: Tests CSRF protection
3. **OAuth Error**: Tests OAuth provider error handling
4. **Missing State Cookie**: Tests state cookie validation
5. **Database Integration**: Tests audit logging
6. **Session Management**: Tests cookie setting

### Manual Testing

1. Start development server: `npm run dev`
2. Navigate to `/api/auth/login` to initiate OAuth flow
3. Complete OAuth flow with Google
4. Verify callback handling and cookie setting
5. Check database for session and audit log entries

## Performance Considerations

### Database Operations

- **Connection Pooling**: Uses D1 database service with connection management
- **Query Optimization**: Indexed queries for user lookup and session management
- **Batch Operations**: Efficient bulk operations where possible

### Error Handling

- **Non-blocking Errors**: Email failures don't block authentication
- **Graceful Degradation**: Core authentication continues if audit logging fails
- **Resource Cleanup**: Automatic cookie cleanup on errors

### Security Monitoring

- **Rate Limiting**: Consider implementing rate limiting for callback endpoint
- **Suspicious Activity**: Monitor for repeated state mismatches from same IP
- **Session Cleanup**: Implement periodic cleanup of expired sessions

## Monitoring and Alerting

### Key Metrics

- Authentication success/failure rates
- OAuth error frequencies
- State mismatch incidents (potential CSRF attacks)
- Email delivery success rates
- Database operation performance

### Alert Conditions

- High rate of authentication failures
- Repeated state mismatch from same IP
- Database connection failures
- Email service unavailability

## Future Enhancements

### Planned Features

- **Multi-Provider Support**: Support for GitHub, Microsoft, etc.
- **Rate Limiting**: IP-based rate limiting for security
- **Device Management**: Track and manage user devices
- **Session Analytics**: Detailed session usage analytics
- **Advanced Fraud Detection**: ML-based suspicious activity detection

### Security Improvements

- **Refresh Token Rotation**: Implement refresh token rotation
- **Device Fingerprinting**: Enhanced device identification
- **Geolocation Tracking**: Location-based security alerts
- **Behavioral Analysis**: User behavior pattern analysis

## Troubleshooting

### Common Issues

1. **State Mismatch Errors**: Check cookie settings and domain configuration
2. **Database Errors**: Verify D1 database configuration and migrations
3. **Email Failures**: Check email service configuration and API keys
4. **JWT Errors**: Verify JWT secret configuration and length

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
export NODE_ENV=development
npm run dev
```

### Log Analysis

Check audit logs for detailed error information:

```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%failed%' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Conclusion

The enhanced OAuth callback handler provides enterprise-grade authentication with comprehensive security, monitoring, and database integration. It follows security best practices while maintaining performance and reliability for production use.
