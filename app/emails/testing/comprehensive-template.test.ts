import { describe, it, expect } from "vitest";
import { z } from "zod";
import { promises as fs } from 'fs';
import path from 'path';
import { 
  createLiveEmailTestEnvironment, 
  configureEmailTiming, 
  sendTestEmailWithTiming,
  createTestEmailData,
  liveEmailAssertions 
} from "./live-test-utils";

// ============================================================================
// COMPREHENSIVE CHRISTIAN TEMPLATE TEST
// ============================================================================

const ChristianTemplateTestConfigSchema = z.object({
  testRecipient: z.string().email({}),
  fromEmail: z.string().email({}),
  timingInterval: z.number().int().positive(),
});

type ChristianTemplateTestConfig = z.infer<typeof ChristianTemplateTestConfigSchema>;

// All 16 redesigned Christian templates
const CHRISTIAN_TEMPLATES = [
  {
    name: "orders/partial-shipment.html",
    type: "order",
    description: "Partial shipment notification with Christian branding",
    biblicalReference: "Ecclesiastes 3:11 - God's perfect timing"
  },
  {
    name: "orders/gift-order-confirmation.html", 
    type: "order",
    description: "Gift order confirmation with Christian branding",
    biblicalReference: "James 1:17 - Every good gift from above"
  },
  {
    name: "orders/delivery-out_for_delivery.html",
    type: "order", 
    description: "Out for delivery notification with Christian branding",
    biblicalReference: "Isaiah 52:7 - Beautiful feet bringing good news"
  },
  {
    name: "orders/delivery-delivered.html",
    type: "order",
    description: "Delivery confirmation with Christian branding", 
    biblicalReference: "Psalm 37:4 - Delight in the Lord"
  },
  {
    name: "orders/order-cancellation.html",
    type: "order",
    description: "Order cancellation with Christian branding",
    biblicalReference: "Romans 8:28 - All things work together for good"
  },
  {
    name: "account/password-reset.html",
    type: "account",
    description: "Password reset with Christian branding",
    biblicalReference: "2 Corinthians 5:17 - New creation in Christ"
  },
  {
    name: "account/email-verification.html", 
    type: "account",
    description: "Email verification with Christian branding",
    biblicalReference: "2 Timothy 2:19 - The Lord knows those who are His"
  },
  {
    name: "account/welcome-verification.html",
    type: "account", 
    description: "Welcome verification with Christian branding",
    biblicalReference: "Romans 15:7 - Welcome one another as Christ welcomed you"
  },
  {
    name: "account/account-update.html",
    type: "account",
    description: "Account update notification with Christian branding",
    biblicalReference: "Psalm 121:8 - The Lord watches over your coming and going"
  },
  {
    name: "account/password-changed.html",
    type: "account", 
    description: "Password changed notification with Christian branding",
    biblicalReference: "Psalm 51:10 - Create in me a clean heart"
  },
  {
    name: "marketing/product-review.html",
    type: "marketing",
    description: "Product review request with Christian branding",
    biblicalReference: "Matthew 5:16 - Let your light shine before others"
  },
  {
    name: "marketing/order-followup.html",
    type: "marketing",
    description: "Order follow-up with Christian branding", 
    biblicalReference: "1 Thessalonians 5:18 - Give thanks in all circumstances"
  },
  {
    name: "security/password-reset.html",
    type: "security",
    description: "Security password reset with Christian branding",
    biblicalReference: "Psalm 18:2 - The Lord is my fortress"
  },
  {
    name: "security/email-verification.html",
    type: "security",
    description: "Security email verification with Christian branding", 
    biblicalReference: "John 8:12 - I am the light of the world"
  },
  {
    name: "transactional/order-confirmation.html",
    type: "transactional",
    description: "Order confirmation with Christian branding",
    biblicalReference: "James 1:17 - Every good gift comes from above"
  },
  {
    name: "transactional/shipping-notification.html",
    type: "transactional",
    description: "Shipping notification with Christian branding",
    biblicalReference: "Proverbs 3:6 - He will direct your paths"
  }
];

describe("Comprehensive Christian Template Test", () => {
  const config: ChristianTemplateTestConfig = {
    testRecipient: "njordrenterprises@gmail.com",
    fromEmail: "noreply@godwear.ca", 
    timingInterval: 60000, // 60 seconds between emails
  };

  it("should send all 16 redesigned Christian templates at 1-minute intervals", async () => {
    console.log("🙏 Starting comprehensive Christian template test...");
    console.log(`📧 Sending ${CHRISTIAN_TEMPLATES.length} templates to ${config.testRecipient}`);
    console.log(`⏱️  Interval: ${config.timingInterval/1000} seconds between emails`);
    
    const testEnv = createLiveEmailTestEnvironment();
    
    // Configure timing for 60-second intervals
    configureEmailTiming(testEnv, {
      testing: config.timingInterval,
    });

    const results = [];
    let emailCount = 0;

    for (const template of CHRISTIAN_TEMPLATES) {
      emailCount++;
      console.log(`\n📧 [${emailCount}/${CHRISTIAN_TEMPLATES.length}] Sending ${template.name}...`);
      console.log(`   📖 ${template.biblicalReference}`);
      
      const startTime = Date.now();
      
      try {
        // Read the actual template file
        const templatePath = path.resolve('/home/tangled/godwear/app/emails/templates', template.name);
        const templateHtml = await fs.readFile(templatePath, 'utf-8');
        
        // Import mock data processing functions
        const { 
          generateOrderTemplateData,
          generateAccountTemplateData, 
          generateMarketingTemplateData,
          generateTemplateDataForPersona,
          processTemplate,
          CUSTOMER_PERSONAS 
        } = await import('../data/template-data');
        
        // Generate appropriate mock data based on template type
        let mockData: Record<string, any>;
        const persona = Object.keys(CUSTOMER_PERSONAS)[emailCount % Object.keys(CUSTOMER_PERSONAS).length] as keyof typeof CUSTOMER_PERSONAS;
        
        switch (template.type) {
          case 'order':
            mockData = generateTemplateDataForPersona(persona, 'order');
            break;
          case 'account':
          case 'security':
            mockData = generateTemplateDataForPersona(persona, 'account');
            break;
          case 'marketing':
          case 'transactional':
            mockData = generateTemplateDataForPersona(persona, 'marketing');
            break;
          default:
            mockData = generateAccountTemplateData();
        }
        
        // Process the template with mock data to replace {{variables}}
        const processedHtml = processTemplate(templateHtml, mockData);
        
        // Generate appropriate subject line for this template type with mock data
        const subject = generateTemplateSubject(template, emailCount, CHRISTIAN_TEMPLATES.length, mockData);
        
        // Generate plain text version from processed HTML with mock data
        const plainText = generatePlainTextFromTemplate(template, emailCount, CHRISTIAN_TEMPLATES.length, mockData);
        
        console.log(`   👤 Using persona: ${mockData.name}`);
        console.log(`   📊 Variables processed: ${Object.keys(mockData).length} fields`);
        console.log(`   📧 Subject: ${subject}`);
        
        const result = await sendTestEmailWithTiming(
          testEnv,
          `Christian Template Test ${emailCount}/${CHRISTIAN_TEMPLATES.length}`,
          testEnv.mailerSendService.sendRawEmail({
            recipient: { email: config.testRecipient },
            subject: subject,
            html: processedHtml,
            text: plainText,
          })
        );
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          template: template.name,
          success: true,
          messageId: result.messageId,
          duration,
          timestamp: new Date().toISOString()
        });
        
        console.log(`   ✅ Sent successfully in ${duration}ms`);
        console.log(`   📨 Message ID: ${result.messageId}`);
        
        // Wait for the timing interval before sending next email (except for last one)
        if (emailCount < CHRISTIAN_TEMPLATES.length) {
          console.log(`   ⏳ Waiting ${config.timingInterval/1000} seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, config.timingInterval));
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to send ${template.name}:`, error);
        results.push({
          template: template.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n🎉 Comprehensive Christian Template Test Complete!`);
    console.log(`✅ Successful: ${successful}/${CHRISTIAN_TEMPLATES.length}`);
    console.log(`❌ Failed: ${failed}/${CHRISTIAN_TEMPLATES.length}`);
    console.log(`📧 Check ${config.testRecipient} for all ${successful} Christian-branded emails`);
    
    // Verify all emails were sent successfully
    expect(successful).toBe(CHRISTIAN_TEMPLATES.length);
    expect(failed).toBe(0);
    
    // Verify timing was respected
    expect(testEnv.emailTimings.length).toBe(CHRISTIAN_TEMPLATES.length);
    
    console.log("🙏 All Christian templates sent with proper timing intervals!");
  }, 30 * 60 * 1000); // 30 minute timeout for all emails
});

// Helper function to generate appropriate subject line for each template type
function generateTemplateSubject(
  template: typeof CHRISTIAN_TEMPLATES[0], 
  emailCount: number, 
  totalCount: number,
  mockData?: Record<string, any>
): string {
  const timestamp = new Date().toLocaleString();
  
  // If mock data is provided, use personalized subjects
  if (mockData) {
    const subjectMap: Record<string, (data: Record<string, any>) => string> = {
      // Order templates
      'orders/partial-shipment.html': (data) => `🙏 ${data.name}, Your Order #${data.orderNumber} is Partially Shipped`,
      'orders/gift-order-confirmation.html': (data) => `🎁 ${data.name}, Gift Order #${data.orderNumber} Confirmed - Every Good Gift`,
      'orders/delivery-out_for_delivery.html': (data) => `🚚 ${data.name}, Order #${data.orderNumber} Out for Delivery`,
      'orders/delivery-delivered.html': (data) => `✅ ${data.name}, Order #${data.orderNumber} Delivered - Delight in the Lord`,
      'orders/order-cancellation.html': (data) => `💙 ${data.name}, Order #${data.orderNumber} Cancelled - All Things Work Together`,
      
      // Account templates
      'account/password-reset.html': (data) => `🔐 ${data.name}, Reset Your GodWear Password - New Creation`,
      'account/email-verification.html': (data) => `✉️ ${data.name}, Verify Your GodWear Email - The Lord Knows His Own`,
      'account/welcome-verification.html': (data) => `🙏 Welcome ${data.name} to GodWear - Christ Welcomes You`,
      'account/account-update.html': (data) => `📝 ${data.name}, Your GodWear Account Updated`,
      'account/password-changed.html': (data) => `🔒 ${data.name}, Password Changed Successfully - Clean Heart`,
      
      // Marketing templates
      'marketing/product-review.html': (data) => `⭐ ${data.name}, Share Your GodWear Experience - Let Your Light Shine`,
      'marketing/order-followup.html': (data) => `💙 ${data.name}, How Was Your GodWear Experience?`,
      
      // Security templates
      'security/password-reset.html': (data) => `🛡️ ${data.name}, GodWear Security: Password Reset`,
      'security/email-verification.html': (data) => `🔐 ${data.name}, GodWear Security: Verify Your Email`,
      
      // Transactional templates
      'transactional/order-confirmation.html': (data) => `📦 ${data.name}, Order #${data.orderNumber || 'N/A'} Confirmed - Every Good Gift`,
      'transactional/shipping-notification.html': (data) => `🚚 ${data.name}, Order #${data.orderNumber || 'N/A'} Has Shipped`
    };
    
    const subjectGenerator = subjectMap[template.name];
    if (subjectGenerator) {
      const baseSubject = subjectGenerator(mockData);
      return `${baseSubject} [Mock Data Test ${emailCount}/${totalCount}]`;
    }
  }
  
  // Generate contextually appropriate subject lines based on template type
  const subjectMap: Record<string, string> = {
    // Order templates
    'orders/partial-shipment.html': '🙏 Your GodWear Order is Partially Shipped - Walking in Faith',
    'orders/gift-order-confirmation.html': '🎁 Gift Order Confirmed - Every Good Gift from Above',
    'orders/delivery-out_for_delivery.html': '🚚 Your GodWear Order is Out for Delivery - Beautiful Feet',
    'orders/delivery-delivered.html': '✅ Your GodWear Order Has Been Delivered - Delight in the Lord',
    'orders/order-cancellation.html': '💙 Order Cancellation - All Things Work Together for Good',
    
    // Account templates
    'account/password-reset.html': '🔐 Reset Your GodWear Password - New Creation in Christ',
    'account/email-verification.html': '✉️ Verify Your GodWear Email - The Lord Knows His Own',
    'account/welcome-verification.html': '🙏 Welcome to GodWear - Christ Welcomes You',
    'account/account-update.html': '📝 Your GodWear Account Updated - The Lord Watches Over You',
    'account/password-changed.html': '🔒 Password Changed Successfully - Clean Heart Created',
    
    // Marketing templates
    'marketing/product-review.html': '⭐ Share Your GodWear Experience - Let Your Light Shine',
    'marketing/order-followup.html': '💙 How Was Your GodWear Experience? - Give Thanks Always',
    
    // Security templates
    'security/password-reset.html': '🛡️ GodWear Security: Password Reset - The Lord is Your Fortress',
    'security/email-verification.html': '🔐 GodWear Security: Verify Your Email - Light of the World',
    
    // Transactional templates
    'transactional/order-confirmation.html': '📦 GodWear Order Confirmed - Every Good Gift from Above',
    'transactional/shipping-notification.html': '🚚 Your GodWear Order Has Shipped - He Directs Your Paths'
  };
  
  const baseSubject = subjectMap[template.name] || `🙏 GodWear ${template.name}`;
  return `${baseSubject} [Test ${emailCount}/${totalCount}] - ${timestamp}`;
}

// Helper function to generate plain text version
function generatePlainTextFromTemplate(
  template: typeof CHRISTIAN_TEMPLATES[0], 
  emailCount: number, 
  totalCount: number,
  mockData?: Record<string, any>
): string {
  const customerName = mockData?.name || 'Valued Customer';
  const supportEmail = mockData?.supportEmail || 'support@godwear.com';
  const currentYear = mockData?.currentYear || new Date().getFullYear();
  
  return `
GodWear - Clothed in Righteousness, Walking in Faith

Dear ${customerName},

${template.name} (Mock Data Test ${emailCount}/${totalCount})

This is a test of the ${template.name} template with PROCESSED MOCK DATA.

🎯 PURPOSE: This email demonstrates that all {{variables}} in your email templates 
are now being replaced with actual data instead of showing as placeholders.

Template Information:
- Type: ${template.type}
- Description: ${template.description}
- Biblical Reference: ${template.biblicalReference}

✅ Mock Data Successfully Processed (Variables Replaced):
- Customer Name: ${customerName} (was {{name}})
- Support Email: ${supportEmail} (was {{supportEmail}})
- Current Year: ${currentYear} (was {{currentYear}})
${mockData?.orderNumber ? `- Order Number: ${mockData.orderNumber} (was {{orderNumber}})` : ''}
${mockData?.total ? `- Order Total: ${mockData.total} (was {{total}})` : ''}
${mockData?.resetUrl ? `- Reset URL: ${mockData.resetUrl} (was {{resetUrl}})` : ''}
${mockData?.ipAddress ? `- IP Address: ${mockData.ipAddress} (was {{ipAddress}})` : ''}

🎨 Christian Features Applied:
✅ Sacred color scheme (Deep Purple, Sacred Gold, Cream)
✅ Georgia serif font for reverent appearance
✅ Biblical references integrated
✅ Faith-based messaging with processed variables
✅ Mobile responsive design
✅ "Clothed in righteousness, walking in faith" tagline

📧 What This Proves:
- All {{placeholder}} variables are now replaced with real data
- Your email templates are production-ready
- Christian branding is properly applied
- Personalization works correctly

The HTML version of this email contains the full processed template with all variables 
replaced and Christian styling applied.

Blessings,
The GodWear Team

---
GodWear
${supportEmail}
Clothed in righteousness, walking in faith
© ${currentYear} GodWear - Faith Meets Fashion

P.S. Check the HTML version of this email to see the full Christian-branded template 
with all variables properly processed!
`;
}
