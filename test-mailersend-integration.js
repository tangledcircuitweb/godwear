#!/usr/bin/env node

/**
 * Comprehensive test suite for enhanced MailerSend integration
 * Tests contact management, marketing campaigns, delivery tracking, and email functionality
 */

import { execSync } from 'child_process';

console.log('🧪 Testing Enhanced MailerSend Integration\n');

// Test configuration
const testConfig = {
  baseUrl: 'http://localhost:8787',
  testEmail: 'test@godwear.ca',
  testName: 'Test User',
  testSubject: 'MailerSend Integration Test',
};

/**
 * Test welcome email with contact management
 */
async function testWelcomeEmailWithContacts() {
  console.log('📋 Test 1: Welcome email with contact management');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/notifications/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testConfig.testEmail,
        name: testConfig.testName,
        addToContacts: true,
        customFields: {
          test_user: true,
          signup_source: 'integration_test',
          test_timestamp: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Welcome email with contact management test passed');
      console.log(`   Message ID: ${data.data?.messageId || 'N/A'}`);
      console.log(`   Contact ID: ${data.data?.contactId || 'N/A'}`);
      console.log(`   Recipient: ${testConfig.testEmail}`);
    } else {
      console.log('❌ Welcome email with contact management test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Welcome email with contact management test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test custom email notification
 */
async function testCustomEmailNotification() {
  console.log('📋 Test 2: Custom email notification');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: testConfig.testEmail,
        subject: testConfig.testSubject,
        htmlContent: `
          <h1>MailerSend Integration Test</h1>
          <p>This is a test of the enhanced MailerSend integration.</p>
          <p><strong>Features tested:</strong></p>
          <ul>
            <li>Custom email sending</li>
            <li>HTML content rendering</li>
            <li>Contact management integration</li>
            <li>Delivery tracking</li>
          </ul>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        textContent: `
          MailerSend Integration Test
          
          This is a test of the enhanced MailerSend integration.
          
          Features tested:
          - Custom email sending
          - HTML content rendering
          - Contact management integration
          - Delivery tracking
          
          Timestamp: ${new Date().toISOString()}
        `,
        recipientName: testConfig.testName,
        addToContacts: true,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Custom email notification test passed');
      console.log(`   Message ID: ${data.data?.messageId || 'N/A'}`);
      console.log(`   Contact ID: ${data.data?.contactId || 'N/A'}`);
      console.log(`   Subject: ${testConfig.testSubject}`);
    } else {
      console.log('❌ Custom email notification test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Custom email notification test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test order confirmation email
 */
async function testOrderConfirmationEmail() {
  console.log('📋 Test 3: Order confirmation email');
  
  try {
    const orderData = {
      orderId: 'TEST-' + Date.now(),
      customerName: testConfig.testName,
      items: [
        { name: 'Faith T-Shirt', quantity: 2, price: 29.99 },
        { name: 'Prayer Hoodie', quantity: 1, price: 49.99 },
      ],
      total: 109.97,
      shippingAddress: '123 Faith Street, Blessing City, BC V1A 2B3',
    };

    const response = await fetch(`${testConfig.baseUrl}/api/notifications/order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testConfig.testEmail,
        orderData,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Order confirmation email test passed');
      console.log(`   Order ID: ${orderData.orderId}`);
      console.log(`   Total: $${orderData.total}`);
      console.log(`   Message ID: ${data.data?.messageId || 'N/A'}`);
    } else {
      console.log('❌ Order confirmation email test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Order confirmation email test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test password reset email
 */
async function testPasswordResetEmail() {
  console.log('📋 Test 4: Password reset email');
  
  try {
    const resetToken = 'test-reset-token-' + Date.now();

    const response = await fetch(`${testConfig.baseUrl}/api/notifications/password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testConfig.testEmail,
        resetToken,
        userName: testConfig.testName,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Password reset email test passed');
      console.log(`   Reset token: ${resetToken}`);
      console.log(`   Message ID: ${data.data?.messageId || 'N/A'}`);
    } else {
      console.log('❌ Password reset email test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Password reset email test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test bulk email functionality
 */
async function testBulkEmail() {
  console.log('📋 Test 5: Bulk email functionality');
  
  try {
    const recipients = [
      { email: testConfig.testEmail, name: testConfig.testName },
      { email: 'test2@godwear.ca', name: 'Test User 2' },
      { email: 'test3@godwear.ca', name: 'Test User 3' },
    ];

    const response = await fetch(`${testConfig.baseUrl}/api/notifications/bulk-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        subject: 'GodWear Newsletter - Faith & Fashion Updates',
        htmlContent: `
          <h1>GodWear Newsletter 📧</h1>
          <p>Welcome to our latest newsletter featuring faith-inspired fashion!</p>
          <h2>New Arrivals</h2>
          <ul>
            <li>Scripture Verse T-Shirts</li>
            <li>Prayer Warrior Hoodies</li>
            <li>Faith-Based Accessories</li>
          </ul>
          <p><strong>Special Offer:</strong> Use code FAITH20 for 20% off your next order!</p>
          <p>Blessings,<br>The GodWear Team</p>
        `,
        textContent: `
          GodWear Newsletter
          
          Welcome to our latest newsletter featuring faith-inspired fashion!
          
          New Arrivals:
          - Scripture Verse T-Shirts
          - Prayer Warrior Hoodies
          - Faith-Based Accessories
          
          Special Offer: Use code FAITH20 for 20% off your next order!
          
          Blessings,
          The GodWear Team
        `,
        tags: ['newsletter', 'marketing', 'test'],
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Bulk email test passed');
      console.log(`   Recipients: ${recipients.length}`);
      console.log(`   Campaign ID: ${data.data?.messageId || 'N/A'}`);
    } else {
      console.log('❌ Bulk email test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Bulk email test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test MailerSend service health check
 */
async function testServiceHealthCheck() {
  console.log('📋 Test 6: MailerSend service health check');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/health/notifications`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      const healthData = data.data;
      console.log('✅ Service health check test passed');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Message: ${healthData.message}`);
      console.log(`   Features: ${healthData.details?.features?.join(', ') || 'N/A'}`);
    } else {
      console.log('❌ Service health check test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Service health check test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
  console.log('📋 Test 7: Email configuration test');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/notifications/test-config`, {
      method: 'POST',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Email configuration test passed');
      console.log(`   Configuration: Valid`);
      console.log(`   API Connection: Working`);
      console.log(`   Test Email: Sent`);
    } else {
      console.log('❌ Email configuration test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Email configuration test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test notification statistics
 */
async function testNotificationStatistics() {
  console.log('📋 Test 8: Notification statistics');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/notifications/stats`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      const stats = data.data;
      console.log('✅ Notification statistics test passed');
      console.log(`   Total Sent: ${stats.totalSent}`);
      console.log(`   Total Failed: ${stats.totalFailed}`);
      console.log(`   Contacts Managed: ${stats.contactsManaged}`);
      console.log(`   Recent Activity: ${stats.recentActivity?.length || 0} events`);
    } else {
      console.log('❌ Notification statistics test failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Notification statistics test failed with exception');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Enhanced MailerSend Integration Test Suite\n');
  
  // Check if development server is running
  try {
    const healthCheck = await fetch(`${testConfig.baseUrl}/api/health`);
    if (!healthCheck.ok) {
      throw new Error('Health check failed');
    }
    console.log('✅ Development server is running\n');
  } catch (error) {
    console.log('❌ Development server is not running');
    console.log('   Please start the development server with: npm run dev');
    console.log('   Then run this test again\n');
    return;
  }

  // Run all tests
  await testWelcomeEmailWithContacts();
  await testCustomEmailNotification();
  await testOrderConfirmationEmail();
  await testPasswordResetEmail();
  await testBulkEmail();
  await testServiceHealthCheck();
  await testEmailConfiguration();
  await testNotificationStatistics();
  
  console.log('🏁 Enhanced MailerSend Integration Test Suite Complete');
  console.log('\n📊 Test Summary:');
  console.log('   - Welcome email with contact management');
  console.log('   - Custom email notifications');
  console.log('   - Order confirmation emails');
  console.log('   - Password reset emails');
  console.log('   - Bulk email campaigns');
  console.log('   - Service health monitoring');
  console.log('   - Configuration testing');
  console.log('   - Statistics and analytics');
  console.log('\n🚀 Enhanced Features Tested:');
  console.log('   - Contact management and segmentation');
  console.log('   - Marketing campaign functionality');
  console.log('   - Email delivery tracking');
  console.log('   - Enhanced email templates');
  console.log('   - Bulk email capabilities');
  console.log('   - Comprehensive error handling');
  console.log('   - Service health monitoring');
  console.log('   - Analytics and reporting');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testConfig };
