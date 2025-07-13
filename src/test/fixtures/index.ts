import type { TestUser } from '../types';
import { TEST_USERS } from '../constants';
import { createTestUser, generateTestJWT } from '../helpers/auth';

// Common user fixtures
export const userFixtures = {
  // Regular users
  regularUser: TEST_USERS.REGULAR_USER,
  adminUser: TEST_USERS.ADMIN_USER,
  unverifiedUser: TEST_USERS.UNVERIFIED_USER,
  
  // OAuth users
  googleUser: TEST_USERS.GOOGLE_USER,
  
  // Dynamic users for testing
  newUser: () => createTestUser({
    email: `new-user-${Date.now()}@godwear.com`,
    name: 'New Test User',
  }),
  
  newAdmin: () => createTestUser({
    email: `new-admin-${Date.now()}@godwear.com`,
    name: 'New Admin User',
    role: 'ADMIN',
  }),
  
  // Users with specific scenarios
  userWithLongName: () => createTestUser({
    name: 'This Is A Very Long User Name That Might Cause Issues In Some Systems',
    email: `long-name-${Date.now()}@godwear.com`,
  }),
  
  userWithSpecialChars: () => createTestUser({
    name: 'Üser Wïth Spëcïal Chärs',
    email: `special-${Date.now()}@godwear.com`,
  }),
  
  // Batch users
  multipleUsers: (count: number = 5) => Array.from({ length: count }, (_, i) => 
    createTestUser({
      email: `batch-user-${i}-${Date.now()}@godwear.com`,
      name: `Batch User ${i + 1}`,
    })
  ),
};

// Authentication fixtures
export const authFixtures = {
  // Valid tokens
  validUserToken: () => generateTestJWT({
    userId: userFixtures.regularUser.id,
    email: userFixtures.regularUser.email,
    role: userFixtures.regularUser.role,
  }),
  
  validAdminToken: () => generateTestJWT({
    userId: userFixtures.adminUser.id,
    email: userFixtures.adminUser.email,
    role: userFixtures.adminUser.role,
  }),
  
  // Invalid tokens
  expiredToken: () => generateTestJWT({
    userId: userFixtures.regularUser.id,
    email: userFixtures.regularUser.email,
    role: userFixtures.regularUser.role,
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  }),
  
  invalidToken: 'invalid.jwt.token',
  malformedToken: 'not-a-jwt-token',
  
  // OAuth states
  validGoogleState: () => btoa(JSON.stringify({
    provider: 'google',
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substr(2, 16),
  })),
  
  expiredState: () => btoa(JSON.stringify({
    provider: 'google',
    timestamp: Date.now() - 700000, // 11+ minutes ago
    nonce: Math.random().toString(36).substr(2, 16),
  })),
};

// Request fixtures
export const requestFixtures = {
  // User registration
  validRegistration: {
    email: 'newuser@godwear.com',
    name: 'New User',
    password: 'SecurePassword123!',
  },
  
  invalidRegistration: {
    email: 'invalid-email',
    name: '',
    password: '123', // Too short
  },
  
  // User login
  validLogin: {
    email: userFixtures.regularUser.email,
    password: 'correct-password',
  },
  
  invalidLogin: {
    email: userFixtures.regularUser.email,
    password: 'wrong-password',
  },
  
  // User updates
  validUserUpdate: {
    name: 'Updated Name',
    email: 'updated@godwear.com',
  },
  
  invalidUserUpdate: {
    email: 'invalid-email-format',
    name: '', // Empty name
  },
  
  // Password changes
  validPasswordChange: {
    currentPassword: 'current-password',
    newPassword: 'NewSecurePassword123!',
  },
  
  invalidPasswordChange: {
    currentPassword: 'wrong-current-password',
    newPassword: '123', // Too weak
  },
};

// Response fixtures
export const responseFixtures = {
  // Success responses
  userCreated: (user: TestUser) => ({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  }),
  
  usersList: (users: TestUser[]) => ({
    success: true,
    data: {
      items: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      })),
      pagination: {
        total: users.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(users.length / 10),
      },
    },
  }),
  
  loginSuccess: (user: TestUser, token: string) => ({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  }),
  
  // Error responses
  validationError: (details: Record<string, string>) => ({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      timestamp: new Date().toISOString(),
      details,
    },
  }),
  
  unauthorizedError: {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    },
  },
  
  forbiddenError: {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied',
      timestamp: new Date().toISOString(),
    },
  },
  
  notFoundError: {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      timestamp: new Date().toISOString(),
    },
  },
  
  conflictError: {
    success: false,
    error: {
      code: 'CONFLICT',
      message: 'Resource already exists',
      timestamp: new Date().toISOString(),
    },
  },
  
  internalError: {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    },
  },
};

// Email fixtures
export const emailFixtures = {
  welcomeEmail: {
    to: [{ email: 'user@godwear.com' }],
    from: { email: 'welcome@godwear.com' },
    subject: 'Welcome to GodWear!',
    template_id: 'welcome-template',
    variables: {
      userName: 'Test User',
      welcomeBonus: 'WELCOME20',
    },
  },
  
  passwordResetEmail: {
    to: [{ email: 'user@godwear.com' }],
    from: { email: 'noreply@godwear.com' },
    subject: 'Reset Your Password',
    template_id: 'password-reset-template',
    variables: {
      resetLink: 'https://godwear.com/reset-password?token=abc123',
      expiresIn: '1 hour',
    },
  },
  
  emailVerificationEmail: {
    to: [{ email: 'user@godwear.com' }],
    from: { email: 'noreply@godwear.com' },
    subject: 'Verify Your Email Address',
    template_id: 'email-verification-template',
    variables: {
      verificationLink: 'https://godwear.com/verify-email?token=xyz789',
      userName: 'Test User',
    },
  },
  
  orderConfirmationEmail: {
    to: [{ email: 'customer@godwear.com' }],
    from: { email: 'orders@godwear.com' },
    subject: 'Order Confirmation #12345',
    template_id: 'order-confirmation-template',
    variables: {
      orderNumber: '12345',
      customerName: 'Test Customer',
      orderTotal: '$99.99',
      items: [
        { name: 'GodWear T-Shirt', quantity: 2, price: '$29.99' },
        { name: 'GodWear Hoodie', quantity: 1, price: '$39.99' },
      ],
    },
  },
};

// Database fixtures
export const databaseFixtures = {
  userRecord: (user: TestUser) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider,
    provider_id: user.providerId || null,
    email_verified: user.emailVerified ? 1 : 0,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }),
  
  sessionRecord: (userId: string) => ({
    id: `session-${userId}-${Date.now()}`,
    user_id: userId,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date().toISOString(),
  }),
  
  // Batch records
  multipleUserRecords: (count: number = 5) => 
    userFixtures.multipleUsers(count).map(user => databaseFixtures.userRecord(user)),
};

// Export all fixtures
export const fixtures = {
  users: userFixtures,
  auth: authFixtures,
  requests: requestFixtures,
  responses: responseFixtures,
  emails: emailFixtures,
  database: databaseFixtures,
};

export default fixtures;
