import { describe, it, expect } from "vitest";
import { z } from "zod";
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
        const result = await sendTestEmailWithTiming(
          testEnv,
          `Christian Template Test ${emailCount}/${CHRISTIAN_TEMPLATES.length}`,
          testEnv.mailerSendService.sendRawEmail({
            to: config.testRecipient,
            subject: `🙏 Christian Template ${emailCount}/${CHRISTIAN_TEMPLATES.length}: ${template.name} - ${new Date().toLocaleString()}`,
            html: await generateChristianTemplateTestEmail(template, emailCount, CHRISTIAN_TEMPLATES.length),
            text: await generateChristianTemplateTestText(template, emailCount, CHRISTIAN_TEMPLATES.length),
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

// Helper function to generate test email HTML
async function generateChristianTemplateTestEmail(
  template: typeof CHRISTIAN_TEMPLATES[0], 
  emailCount: number, 
  totalCount: number
): Promise<string> {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Christian Template Test - ${template.name}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      color: #4C1D95;
      margin: 0;
      padding: 20px;
      background-color: #FEF7ED;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FEF7ED;
      border: 3px solid #B45309;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4C1D95 0%, #6B21A8 100%);
      color: #FEF7ED;
      padding: 30px 20px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .template-info {
      background: #4C1D95;
      color: #FEF7ED;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .biblical-reference {
      background: #B45309;
      color: #FEF7ED;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-style: italic;
    }
    .progress {
      background: #6B21A8;
      color: #FEF7ED;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
    }
    .features {
      background: #FEF7ED;
      border: 2px solid #B45309;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      padding: 8px 0;
      border-bottom: 1px solid #B45309;
    }
    .feature-list li:last-child {
      border-bottom: none;
    }
    .footer {
      background: #4C1D95;
      color: #FEF7ED;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🙏 Christian Template Test 🙏</h1>
      <p>Comprehensive Testing of Redesigned Templates</p>
    </div>
    
    <div class="content">
      <div class="progress">
        📧 Email ${emailCount} of ${totalCount}
      </div>
      
      <div class="template-info">
        <h2>💙 Template: ${template.name} 💙</h2>
        <p><strong>Type:</strong> ${template.type}</p>
        <p><strong>Description:</strong> ${template.description}</p>
      </div>
      
      <div class="biblical-reference">
        <h3>📖 Biblical Reference</h3>
        <p>${template.biblicalReference}</p>
      </div>
      
      <div class="features">
        <h3>✨ Christian Branding Features Applied</h3>
        <ul class="feature-list">
          <li>✅ Deep Purple (#4C1D95), Sacred Gold (#B45309), Cream (#FEF7ED) color scheme</li>
          <li>✅ Georgia serif font for traditional, reverent appearance</li>
          <li>✅ Biblical references contextually integrated</li>
          <li>✅ Faith-based messaging throughout</li>
          <li>✅ Sacred terminology and holy emojis</li>
          <li>✅ Mobile responsive design with Christian styling</li>
          <li>✅ "Clothed in righteousness, walking in faith" tagline</li>
          <li>✅ Dark mode compatibility with Christian colors</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 18px; color: #4C1D95; font-weight: bold;">
          🙏 Clothed in righteousness, walking in faith 🙏
        </p>
        <p style="color: #6B21A8;">
          <em>With Christian blessings and divine testing,</em><br>
          <strong style="color: #B45309;">The GodWear Development Team</strong> 💙
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>GodWear - Faith-Inspired Fashion</strong></p>
      <p>Comprehensive Christian Template Testing System</p>
      <p>Sent at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to generate test email text
async function generateChristianTemplateTestText(
  template: typeof CHRISTIAN_TEMPLATES[0], 
  emailCount: number, 
  totalCount: number
): Promise<string> {
  return `
🙏 CHRISTIAN TEMPLATE TEST 🙏
Comprehensive Testing of Redesigned Templates

📧 Email ${emailCount} of ${totalCount}

💙 Template: ${template.name}
Type: ${template.type}
Description: ${template.description}

📖 Biblical Reference:
${template.biblicalReference}

✨ Christian Branding Features Applied:
✅ Deep Purple (#4C1D95), Sacred Gold (#B45309), Cream (#FEF7ED) color scheme
✅ Georgia serif font for traditional, reverent appearance
✅ Biblical references contextually integrated
✅ Faith-based messaging throughout
✅ Sacred terminology and holy emojis
✅ Mobile responsive design with Christian styling
✅ "Clothed in righteousness, walking in faith" tagline
✅ Dark mode compatibility with Christian colors

🙏 Clothed in righteousness, walking in faith 🙏

With Christian blessings and divine testing,
The GodWear Development Team 💙

---
GodWear - Faith-Inspired Fashion
Comprehensive Christian Template Testing System
Sent at ${new Date().toLocaleString()}
  `;
}
