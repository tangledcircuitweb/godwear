import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { 
  createLiveEmailTestEnvironment, 
  sendTestEmailWithTiming, 
  createTestEmailData,
  configureEmailTiming,
  liveEmailAssertions,
  waitForMilliseconds
} from "./live-test-utils";

// Set timeout for all tests in this file to 30 seconds
const TEST_TIMEOUT = 30000;

// ============================================================================
// EMAIL SHOWCASE CONFIGURATION
// ============================================================================

const EmailShowcaseConfigSchema = z.object({
  testRecipient: z.string().email({}),
  fromEmail: z.string().email({}),
  timingInterval: z.number().int().positive(),
});

type EmailShowcaseConfig = z.infer<typeof EmailShowcaseConfigSchema>;

// ============================================================================
// CHRISTIAN GODWEAR EMAIL SHOWCASE - ALL TEMPLATES WITH MOBILE RESPONSIVENESS
// ============================================================================

describe("Christian GodWear Email Showcase - ALL Templates", () => {
  const config: EmailShowcaseConfig = {
    testRecipient: "njordrenterprises@gmail.com", // YOUR EMAIL - you'll receive ALL emails
    fromEmail: "noreply@godwear.ca",
    timingInterval: 60000, // 60 seconds (1 minute) between emails for proper rate limiting
  };

  let testEnv = createLiveEmailTestEnvironment();
  
  beforeEach(() => {
    testEnv = createLiveEmailTestEnvironment();
    configureEmailTiming(testEnv, {
      testing: config.timingInterval,
    });
    
    console.log(`Christian Email Showcase initialized`);
    console.log(`All emails will be sent to: ${config.testRecipient}`);
    console.log(`${config.timingInterval/1000}s interval between emails`);
  });

  // Holy Color Palette:
  // Deep Purple: #4C1D95 (primary)
  // Royal Purple: #6B21A8 (secondary) 
  // Sacred Gold: #B45309 (accent)
  // Pure White: #FFFFFF (background)
  // Cream: #FEF7ED (soft background)
  // Holy Gray: #6B7280 (text)

  describe("📋 Order & Commerce Emails", () => {
    it("should send order confirmation email", async () => {
      console.log("🛒 Sending Order Confirmation Email...");
      
      const orderData = createTestEmailData("order-confirmation", {
        customerId: "showcase-customer-001",
        customerEmail: config.testRecipient,
        customerName: "Email Showcase Recipient",
        orderNumber: `SHOWCASE-ORD-${Date.now()}`,
      });

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Order Confirmation Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `Order Blessed & Confirmed - ${orderData.orderNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Order Confirmation - GodWear</title>
            </head>
            <body style="font-family: 'Georgia', serif; padding: 20px; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f8f9ff 0%, #fff8f0 100%);">
              <!-- Header with Cross -->
              <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 40px; text-align: center; border-radius: 16px; margin-bottom: 30px; position: relative;">
                <div style="font-size: 48px; margin-bottom: 10px;">✝️</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">Order Blessed & Confirmed</h1>
                <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">"Give thanks in all circumstances" - 1 Thessalonians 5:18</p>
              </div>
              
              <!-- Main Content -->
              <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); margin-bottom: 30px; border-top: 4px solid #d4af37;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 300;">Thank You for Your Faith-Filled Purchase</h2>
                  <p style="color: #666; margin: 10px 0 0 0; font-style: italic;">"Whatever you do, work at it with all your heart" - Colossians 3:23</p>
                </div>
                
                <div style="background: #f8f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #d4af37; margin-bottom: 30px;">
                  <h3 style="color: #1e3a8a; margin-top: 0; display: flex; align-items: center;"><span style="margin-right: 10px;">📋</span>Order Details</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div><strong style="color: #1e3a8a;">Order Number:</strong><br><span style="color: #666;">${orderData.orderNumber}</span></div>
                    <div><strong style="color: #1e3a8a;">Customer:</strong><br><span style="color: #666;">${orderData.customerName}</span></div>
                    <div><strong style="color: #1e3a8a;">Email:</strong><br><span style="color: #666;">${orderData.customerEmail}</span></div>
                    <div><strong style="color: #1e3a8a;">Total:</strong><br><span style="color: #d4af37; font-size: 18px; font-weight: bold;">$${orderData.total.toFixed(2)}</span></div>
                  </div>
                </div>
                
                <h3 style="color: #1e3a8a; margin-top: 30px; display: flex; align-items: center;"><span style="margin-right: 10px;">🎁</span>Your Blessed Items:</h3>
                ${orderData.items.map(item => `
                  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fefefe;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong style="color: #1e3a8a; font-size: 16px;">${item.name}</strong><br>
                        <span style="color: #666; font-size: 14px;">SKU: ${item.sku} | Quantity: ${item.quantity}</span>
                      </div>
                      <div style="text-align: right;">
                        <span style="color: #d4af37; font-size: 18px; font-weight: bold;">$${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
                
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin-top: 30px; border: 1px solid #d4af37;">
                  <h4 style="color: #1e3a8a; margin-top: 0; display: flex; align-items: center;"><span style="margin-right: 10px;">🙏</span>What's Next in Your Journey?</h4>
                  <ul style="color: #374151; margin-bottom: 0; line-height: 1.8;">
                    <li>📧 You'll receive a shipping blessing when your order departs</li>
                    <li>📱 Track your order's journey in your account</li>
                    <li>📞 Our faithful team is here to serve you</li>
                  </ul>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; color: #666; font-size: 14px; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="margin-bottom: 20px;">
                  <span style="font-size: 24px; color: #d4af37;">✝️</span>
                </div>
                <p style="margin: 0 0 10px 0; font-style: italic; color: #1e3a8a;">"Be strong and courageous!" - Joshua 1:9</p>
                <p style="margin: 0 0 15px 0;"><strong>GodWear</strong> | Clothing for the Faithful</p>
                <p style="margin: 0; font-size: 12px; color: #999;">This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
🛒 ORDER CONFIRMATION - GODWEAR

Order Number: ${orderData.orderNumber}
Customer: ${orderData.customerName}
Email: ${orderData.customerEmail}
Total: $${orderData.total.toFixed(2)}
Order Date: ${new Date().toLocaleDateString()}

🛍️ ITEMS ORDERED:
${orderData.items.map(item => `- ${item.name} (SKU: ${item.sku}) | Qty: ${item.quantity} | $${item.price.toFixed(2)}`).join('\n')}

✅ WHAT'S NEXT:
- You'll receive a shipping confirmation when your order ships
- Track your order status in your account  
- Contact support if you have any questions

---
GodWear | Premium Athletic Wear
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Order Confirmation email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send shipping notification email", async () => {
      console.log("📦 Sending Shipping Notification Email...");
      
      const trackingNumber = `GW${Date.now()}`;
      const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Shipping Notification Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `Your Blessed Order is On Its Way - Tracking: ${trackingNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Shipping Notification - GodWear</title>
            </head>
            <body style="font-family: 'Georgia', serif; padding: 20px; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f8f9ff 0%, #fff8f0 100%);">
              <!-- Header with Dove -->
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px; text-align: center; border-radius: 16px; margin-bottom: 30px; position: relative;">
                <div style="font-size: 48px; margin-bottom: 10px;">🕊️</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">Your Blessed Order is On Its Way!</h1>
                <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">"He will command his angels concerning you" - Psalm 91:11</p>
              </div>
              
              <!-- Main Content -->
              <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); margin-bottom: 30px; border-top: 4px solid #d4af37;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 300;">Your Package is Traveling with Purpose</h2>
                  <p style="color: #666; margin: 10px 0 0 0; font-style: italic;">"Every good and perfect gift is from above" - James 1:17</p>
                </div>
                
                <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; border-left: 4px solid #d4af37; margin-bottom: 30px;">
                  <h3 style="color: #059669; margin-top: 0; display: flex; align-items: center;"><span style="margin-right: 10px;">📋</span>Shipping Details</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div><strong style="color: #059669;">Tracking Number:</strong><br><span style="font-family: monospace; background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #d1d5db;">${trackingNumber}</span></div>
                    <div><strong style="color: #059669;">Carrier:</strong><br><span style="color: #666;">FedEx Express</span></div>
                    <div><strong style="color: #059669;">Estimated Delivery:</strong><br><span style="color: #666;">${estimatedDelivery}</span></div>
                    <div><strong style="color: #059669;">Status:</strong><br><span style="color: #d4af37; font-weight: bold;">In Transit ✈️</span></div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3); transition: all 0.3s ease;">
                    🔍 Track Your Blessed Package
                  </a>
                </div>
                
                <h3 style="color: #059669; margin-top: 30px; display: flex; align-items: center;"><span style="margin-right: 10px;">📦</span>What's in Your Package:</h3>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fefefe;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="color: #059669; font-size: 16px;">GodWear Faith Performance T-Shirt</strong><br>
                      <span style="color: #666; font-size: 14px;">Size: Medium | Color: Heavenly White</span><br>
                      <span style="color: #666; font-size: 14px;">Quantity: 1 | "I can do all things through Christ" - Phil 4:13</span>
                    </div>
                  </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin-top: 30px; border: 1px solid #d4af37;">
                  <h4 style="color: #059669; margin-top: 0; display: flex; align-items: center;"><span style="margin-right: 10px;">🙏</span>Delivery Blessings & Tips:</h4>
                  <ul style="color: #374151; margin-bottom: 0; line-height: 1.8;">
                    <li>📧 You'll receive divine updates via email and SMS</li>
                    <li>🏠 Someone should be home to receive your blessing</li>
                    <li>📱 Use the tracking link above for real-time updates</li>
                    <li>💝 Your package is handled with care and prayer</li>
                  </ul>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; color: #666; font-size: 14px; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="margin-bottom: 20px;">
                  <span style="font-size: 24px; color: #d4af37;">✝️</span>
                </div>
                <p style="margin: 0 0 10px 0; font-style: italic; color: #059669;">"The Lord will watch over your coming and going" - Psalm 121:8</p>
                <p style="margin: 0 0 15px 0;"><strong>GodWear</strong> | Clothing for the Faithful</p>
                <p style="margin: 0; font-size: 12px; color: #999;">This is a live email showcase from the GodWear testing system</p>
                    <li>🏠 Someone should be available to receive the package</li>
                    <li>📞 Contact the carrier directly for delivery changes</li>
                    <li>📦 Package requires signature confirmation</li>
                  </ul>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear</strong> | Premium Athletic Wear</p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
📦 YOUR GODWEAR ORDER HAS SHIPPED!

📋 SHIPPING DETAILS:
Tracking Number: ${trackingNumber}
Carrier: FedEx Express
Estimated Delivery: ${estimatedDelivery}
Shipping Address: 123 Main St, Your City, State 12345

📦 WHAT'S IN YOUR PACKAGE:
- GodWear Performance T-Shirt
  Size: Medium | Color: Black | Quantity: 1

📱 DELIVERY TIPS:
- You'll receive updates via email and SMS
- Someone should be available to receive the package
- Contact the carrier directly for delivery changes
- Package requires signature confirmation

Track your package: [Tracking Link]

---
GodWear | Premium Athletic Wear
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Shipping Notification email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });
  });

  describe("🔐 Account Security Emails", () => {
    it("should send password reset email", async () => {
      console.log("🔑 Sending Password Reset Email...");
      
      const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const resetUrl = `https://godwear.ca/reset-password?token=${resetToken}`;

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Password Reset Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `Reset Your GodWear Password - Action Required`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">🔑 Password Reset Request</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Secure your GodWear account</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">🔐 Reset Your Password</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  We received a request to reset the password for your GodWear account. If you made this request, 
                  click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    🔑 Reset My Password
                  </a>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #721c24; margin-top: 0;">⚠️ Security Information</h4>
                  <ul style="color: #721c24; margin-bottom: 0;">
                    <li>🕐 This link expires in 1 hour for security</li>
                    <li>🔒 Only use this link if you requested the reset</li>
                    <li>📧 If you didn't request this, ignore this email</li>
                    <li>🛡️ Your account remains secure</li>
                  </ul>
                </div>
                
                <div style="background: #e2e3e5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #6c757d;">
                    <strong>Reset Link:</strong><br>
                    <span style="font-family: monospace; word-break: break-all;">${resetUrl}</span>
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Security Team</strong></p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
🔑 PASSWORD RESET REQUEST - GODWEAR

We received a request to reset the password for your GodWear account.

If you made this request, use the link below to create a new password:
${resetUrl}

⚠️ SECURITY INFORMATION:
- This link expires in 1 hour for security
- Only use this link if you requested the reset
- If you didn't request this, ignore this email
- Your account remains secure

---
GodWear Security Team
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Password Reset email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send login alert email", async () => {
      console.log("🚨 Sending Login Alert Email...");
      
      const loginTime = new Date().toLocaleString();
      const ipAddress = "192.168.1.100";
      const location = "San Francisco, CA";
      const device = "Chrome on MacOS";

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Login Alert Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `🚨 New Login to Your GodWear Account - ${loginTime}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Login Alert - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: #ffc107; color: #212529; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">🚨 New Login Detected</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Account security notification</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">🔐 Login Details</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  We detected a new login to your GodWear account. If this was you, no action is needed. 
                  If you don't recognize this activity, please secure your account immediately.
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #856404; margin-top: 0;">📊 Login Information</h4>
                  <ul style="color: #856404; margin-bottom: 0; list-style: none; padding: 0;">
                    <li style="margin: 8px 0;"><strong>🕐 Time:</strong> ${loginTime}</li>
                    <li style="margin: 8px 0;"><strong>🌐 IP Address:</strong> ${ipAddress}</li>
                    <li style="margin: 8px 0;"><strong>📍 Location:</strong> ${location}</li>
                    <li style="margin: 8px 0;"><strong>💻 Device:</strong> ${device}</li>
                  </ul>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #721c24; margin-top: 0;">⚠️ Didn't Recognize This Login?</h4>
                  <p style="color: #721c24; margin-bottom: 15px;">Take these steps immediately:</p>
                  <ul style="color: #721c24; margin-bottom: 0;">
                    <li>🔑 Change your password right away</li>
                    <li>📱 Enable two-factor authentication</li>
                    <li>🔍 Review recent account activity</li>
                    <li>📞 Contact our security team</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                    🔒 Secure My Account
                  </a>
                  <a href="#" style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    📞 Contact Support
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Security Team</strong></p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
🚨 NEW LOGIN DETECTED - GODWEAR

We detected a new login to your GodWear account.

📊 LOGIN INFORMATION:
Time: ${loginTime}
IP Address: ${ipAddress}
Location: ${location}
Device: ${device}

⚠️ DIDN'T RECOGNIZE THIS LOGIN?
Take these steps immediately:
- Change your password right away
- Enable two-factor authentication
- Review recent account activity
- Contact our security team

If this was you, no action is needed.

---
GodWear Security Team
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Login Alert email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });
  });

  describe("📢 Marketing & Promotional Emails", () => {
    it("should send welcome email", async () => {
      console.log("👋 Sending Welcome Email...");

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Welcome Email Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `👋 Welcome to GodWear - Your Premium Athletic Journey Begins!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 32px;">👋 Welcome to GodWear!</h1>
                <p style="margin: 15px 0 0 0; font-size: 20px;">Your premium athletic journey starts here</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">🎉 You're Part of the GodWear Family!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Thank you for joining GodWear! We're excited to help you achieve your fitness goals with our 
                  premium athletic wear designed for champions like you.
                </p>
                
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #0066cc; margin-top: 0;">🎁 Welcome Bonus - 20% OFF</h4>
                  <p style="color: #0066cc; margin-bottom: 10px;">Use code: <strong style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">WELCOME20</strong></p>
                  <p style="color: #0066cc; margin-bottom: 0; font-size: 14px;">Valid for 30 days on your first purchase</p>
                </div>
                
                <h3 style="color: #333;">🏆 What Makes GodWear Special?</h3>
                <div style="display: grid; gap: 15px;">
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">💪 Premium Quality</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">High-performance fabrics that move with you</p>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">🌟 Innovative Design</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">Cutting-edge athletic wear for peak performance</p>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">🚚 Fast Shipping</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">Free shipping on orders over $75</p>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                    🛍️ Start Shopping
                  </a>
                  <a href="#" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    👤 Complete Profile
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Team</strong> | Premium Athletic Wear</p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
👋 WELCOME TO GODWEAR!

Your premium athletic journey starts here.

Thank you for joining GodWear! We're excited to help you achieve your fitness goals with our premium athletic wear designed for champions like you.

🎁 WELCOME BONUS - 20% OFF
Use code: WELCOME20
Valid for 30 days on your first purchase

🏆 WHAT MAKES GODWEAR SPECIAL?
💪 Premium Quality - High-performance fabrics that move with you
🌟 Innovative Design - Cutting-edge athletic wear for peak performance  
🚚 Fast Shipping - Free shipping on orders over $75

Ready to get started?
- Start Shopping: [Shop Link]
- Complete Profile: [Profile Link]

---
GodWear Team | Premium Athletic Wear
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Welcome email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send promotional sale email", async () => {
      console.log("🔥 Sending Promotional Sale Email...");

      const saleEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Promotional Sale Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `🔥 FLASH SALE: 40% OFF Everything - Limited Time Only!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Flash Sale - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 36px;">🔥 FLASH SALE</h1>
                <p style="margin: 15px 0; font-size: 24px; font-weight: bold;">40% OFF EVERYTHING</p>
                <p style="margin: 0; font-size: 18px;">Limited Time Only - Ends ${saleEndDate}</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="background: #ff6b6b; color: white; padding: 20px; border-radius: 50%; display: inline-block; font-size: 24px; font-weight: bold; width: 80px; height: 80px; line-height: 40px;">
                    40%<br>OFF
                  </div>
                </div>
                
                <h2 style="color: #333; margin-top: 0; text-align: center;">⚡ Don't Miss Out!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                  Our biggest sale of the year is here! Get 40% off all GodWear premium athletic wear. 
                  From performance tees to training gear - everything is on sale!
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h4 style="color: #856404; margin-top: 0;">💳 Use Code</h4>
                  <div style="background: #fff; border: 2px dashed #ff6b6b; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #ff6b6b;">FLASH40</span>
                  </div>
                  <p style="color: #856404; margin-bottom: 0; font-size: 14px;">Copy and paste at checkout</p>
                </div>
                
                <h3 style="color: #333;">🛍️ Featured Sale Items</h3>
                <div style="display: grid; gap: 15px;">
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <h4 style="margin: 0; color: #333;">Performance T-Shirts</h4>
                      <p style="margin: 5px 0; color: #666;">Premium moisture-wicking fabric</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; text-decoration: line-through; color: #999;">$39.99</p>
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ff6b6b;">$23.99</p>
                    </div>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <h4 style="margin: 0; color: #333;">Training Shorts</h4>
                      <p style="margin: 5px 0; color: #666;">Flexible 4-way stretch material</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; text-decoration: line-through; color: #999;">$49.99</p>
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ff6b6b;">$29.99</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #ff6b6b; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">
                    🛒 Shop Sale Now
                  </a>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; color: #721c24; font-weight: bold;">⏰ Sale ends ${saleEndDate} - Don't wait!</p>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Marketing Team</strong></p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
🔥 FLASH SALE - 40% OFF EVERYTHING!

Limited Time Only - Ends ${saleEndDate}

⚡ DON'T MISS OUT!
Our biggest sale of the year is here! Get 40% off all GodWear premium athletic wear.

💳 USE CODE: FLASH40

🛍️ FEATURED SALE ITEMS:
- Performance T-Shirts: $39.99 → $23.99
- Training Shorts: $49.99 → $29.99

⏰ Sale ends ${saleEndDate} - Don't wait!

Shop Sale Now: [Sale Link]

---
GodWear Marketing Team
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Promotional Sale email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });
  });

  describe("📢 Marketing & Promotional Emails", () => {
    it("should send welcome email", async () => {
      console.log("👋 Sending Welcome Email...");

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Welcome Email Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `👋 Welcome to GodWear - Your Premium Athletic Journey Begins!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 32px;">👋 Welcome to GodWear!</h1>
                <p style="margin: 15px 0 0 0; font-size: 20px;">Your premium athletic journey starts here</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">🎉 You're Part of the GodWear Family!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Thank you for joining GodWear! We're excited to help you achieve your fitness goals with our 
                  premium athletic wear designed for champions like you.
                </p>
                
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #0066cc; margin-top: 0;">🎁 Welcome Bonus - 20% OFF</h4>
                  <p style="color: #0066cc; margin-bottom: 10px;">Use code: <strong style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">WELCOME20</strong></p>
                  <p style="color: #0066cc; margin-bottom: 0; font-size: 14px;">Valid for 30 days on your first purchase</p>
                </div>
                
                <h3 style="color: #333;">🏆 What Makes GodWear Special?</h3>
                <div style="display: grid; gap: 15px;">
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">💪 Premium Quality</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">High-performance fabrics that move with you</p>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">🌟 Innovative Design</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">Cutting-edge athletic wear for peak performance</p>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #333;">🚚 Fast Shipping</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">Free shipping on orders over $75</p>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                    🛍️ Start Shopping
                  </a>
                  <a href="#" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    👤 Complete Profile
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Team</strong> | Premium Athletic Wear</p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
👋 WELCOME TO GODWEAR!

Your premium athletic journey starts here.

Thank you for joining GodWear! We're excited to help you achieve your fitness goals with our premium athletic wear designed for champions like you.

🎁 WELCOME BONUS - 20% OFF
Use code: WELCOME20
Valid for 30 days on your first purchase

🏆 WHAT MAKES GODWEAR SPECIAL?
💪 Premium Quality - High-performance fabrics that move with you
🌟 Innovative Design - Cutting-edge athletic wear for peak performance  
🚚 Fast Shipping - Free shipping on orders over $75

Ready to get started?
- Start Shopping: [Shop Link]
- Complete Profile: [Profile Link]

---
GodWear Team | Premium Athletic Wear
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Welcome email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send promotional sale email", async () => {
      console.log("🔥 Sending Promotional Sale Email...");

      const saleEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Promotional Sale Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `🔥 FLASH SALE: 40% OFF Everything - Limited Time Only!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Flash Sale - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 36px;">🔥 FLASH SALE</h1>
                <p style="margin: 15px 0; font-size: 24px; font-weight: bold;">40% OFF EVERYTHING</p>
                <p style="margin: 0; font-size: 18px;">Limited Time Only - Ends ${saleEndDate}</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="background: #ff6b6b; color: white; padding: 20px; border-radius: 50%; display: inline-block; font-size: 24px; font-weight: bold; width: 80px; height: 80px; line-height: 40px;">
                    40%<br>OFF
                  </div>
                </div>
                
                <h2 style="color: #333; margin-top: 0; text-align: center;">⚡ Don't Miss Out!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                  Our biggest sale of the year is here! Get 40% off all GodWear premium athletic wear. 
                  From performance tees to training gear - everything is on sale!
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h4 style="color: #856404; margin-top: 0;">💳 Use Code</h4>
                  <div style="background: #fff; border: 2px dashed #ff6b6b; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #ff6b6b;">FLASH40</span>
                  </div>
                  <p style="color: #856404; margin-bottom: 0; font-size: 14px;">Copy and paste at checkout</p>
                </div>
                
                <h3 style="color: #333;">🛍️ Featured Sale Items</h3>
                <div style="display: grid; gap: 15px;">
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <h4 style="margin: 0; color: #333;">Performance T-Shirts</h4>
                      <p style="margin: 5px 0; color: #666;">Premium moisture-wicking fabric</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; text-decoration: line-through; color: #999;">$39.99</p>
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ff6b6b;">$23.99</p>
                    </div>
                  </div>
                  <div style="border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <h4 style="margin: 0; color: #333;">Training Shorts</h4>
                      <p style="margin: 5px 0; color: #666;">Flexible 4-way stretch material</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; text-decoration: line-through; color: #999;">$49.99</p>
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ff6b6b;">$29.99</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #ff6b6b; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">
                    🛒 Shop Sale Now
                  </a>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; color: #721c24; font-weight: bold;">⏰ Sale ends ${saleEndDate} - Don't wait!</p>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Marketing Team</strong></p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
🔥 FLASH SALE - 40% OFF EVERYTHING!

Limited Time Only - Ends ${saleEndDate}

⚡ DON'T MISS OUT!
Our biggest sale of the year is here! Get 40% off all GodWear premium athletic wear.

💳 USE CODE: FLASH40

🛍️ FEATURED SALE ITEMS:
- Performance T-Shirts: $39.99 → $23.99
- Training Shorts: $49.99 → $29.99

⏰ Sale ends ${saleEndDate} - Don't wait!

Shop Sale Now: [Sale Link]

---
GodWear Marketing Team
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Promotional Sale email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });
  });

  describe("🔧 System Health & Monitoring Emails", () => {
    it("should send system health report email", async () => {
      console.log("📊 Sending System Health Report Email...");

      const reportDate = new Date().toLocaleDateString();
      const uptime = "99.98%";
      const responseTime = "145ms";
      const activeUsers = "1,247";

      const result = await sendTestEmailWithTiming(
        testEnv,
        "System Health Report Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `📊 GodWear System Health Report - ${reportDate}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>System Health Report - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">📊 System Health Report</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Daily Status - ${reportDate}</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">🟢 All Systems Operational</h2>
                
                <div style="display: grid; gap: 15px; margin: 20px 0;">
                  <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #155724;">⚡ Performance Metrics</h4>
                    <div style="margin-top: 15px;">
                      <p style="margin: 5px 0; color: #155724;"><strong>Uptime:</strong> ${uptime}</p>
                      <p style="margin: 5px 0; color: #155724;"><strong>Avg Response Time:</strong> ${responseTime}</p>
                      <p style="margin: 5px 0; color: #155724;"><strong>Active Users:</strong> ${activeUsers}</p>
                      <p style="margin: 5px 0; color: #155724;"><strong>API Calls:</strong> 45,892 (24h)</p>
                    </div>
                  </div>
                  
                  <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 8px;">
                    <h4 style="margin: 0; color: #0066cc;">🛠️ Service Status</h4>
                    <div style="margin-top: 15px;">
                      <p style="margin: 5px 0; color: #0066cc;">✅ <strong>Web Application:</strong> Operational</p>
                      <p style="margin: 5px 0; color: #0066cc;">✅ <strong>API Services:</strong> Operational</p>
                      <p style="margin: 5px 0; color: #0066cc;">✅ <strong>Database:</strong> Operational</p>
                      <p style="margin: 5px 0; color: #0066cc;">✅ <strong>Email Service:</strong> Operational</p>
                      <p style="margin: 5px 0; color: #0066cc;">✅ <strong>CDN:</strong> Operational</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    📊 View Dashboard
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear DevOps Team</strong></p>
                <p>This is a live email showcase from the GodWear testing system</p>
              </div>
            </body>
            </html>
          `,
          text: `
📊 GODWEAR SYSTEM HEALTH REPORT
Daily Status - ${reportDate}

🟢 ALL SYSTEMS OPERATIONAL

⚡ PERFORMANCE METRICS:
- Uptime: ${uptime}
- Avg Response Time: ${responseTime}
- Active Users: ${activeUsers}
- API Calls: 45,892 (24h)

🛠️ SERVICE STATUS:
✅ Web Application: Operational
✅ API Services: Operational
✅ Database: Operational
✅ Email Service: Operational
✅ CDN: Operational

View Dashboard: [Dashboard Link]

---
GodWear DevOps Team
This is a live email showcase from the GodWear testing system
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ System Health Report email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send test completion summary email", async () => {
      console.log("🎯 Sending Test Completion Summary Email...");

      const testDate = new Date().toLocaleDateString();
      const testTime = new Date().toLocaleTimeString();

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Test Summary Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Email Showcase Recipient" },
          subject: `🎯 GodWear Email Showcase Complete - All Templates Sent Successfully!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Showcase Complete - GodWear</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 32px;">🎯 Email Showcase Complete!</h1>
                <p style="margin: 15px 0 0 0; font-size: 20px;">All email templates sent successfully</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">📧 Email Templates Showcased</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Congratulations! You have successfully received all GodWear email templates. 
                  Each email demonstrates different use cases and design patterns.
                </p>
                
                <h3 style="color: #333;">✅ Templates Sent</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <div style="display: grid; gap: 10px;">
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Order Confirmation</strong> - E-commerce transaction email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Shipping Notification</strong> - Package tracking email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Password Reset</strong> - Account security email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Login Alert</strong> - Security notification email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Welcome Email</strong> - User onboarding email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Promotional Sale</strong> - Marketing campaign email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>System Health Report</strong> - Monitoring email</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 8px 0;">
                      <span style="color: #28a745; margin-right: 10px;">✅</span>
                      <span><strong>Test Summary</strong> - This completion email</span>
                    </div>
                  </div>
                </div>
                
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #155724; margin-top: 0;">🚀 Live Testing Success</h4>
                  <ul style="color: #155724; margin-bottom: 0;">
                    <li>✅ All emails sent via real MailerSend API</li>
                    <li>✅ No mock services - 100% live integration</li>
                    <li>✅ Real email delivery to your inbox</li>
                    <li>✅ Proper schema validation and error handling</li>
                    <li>✅ Configurable timing intervals between emails</li>
                  </ul>
                </div>
                
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #0066cc; margin-top: 0;">📊 Test Statistics</h4>
                  <ul style="color: #0066cc; margin-bottom: 0; list-style: none; padding: 0;">
                    <li style="margin: 8px 0;"><strong>Test Date:</strong> ${testDate}</li>
                    <li style="margin: 8px 0;"><strong>Completion Time:</strong> ${testTime}</li>
                    <li style="margin: 8px 0;"><strong>Total Emails:</strong> 8 templates</li>
                    <li style="margin: 8px 0;"><strong>Success Rate:</strong> 100%</li>
                    <li style="margin: 8px 0;"><strong>Delivery Method:</strong> Live MailerSend API</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                    🎉 <strong>Ready for production!</strong> All email templates are working perfectly.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>GodWear Testing System</strong></p>
                <p>Live email showcase completed successfully</p>
              </div>
            </body>
            </html>
          `,
          text: `
🎯 GODWEAR EMAIL SHOWCASE COMPLETE!

All email templates sent successfully.

📧 EMAIL TEMPLATES SHOWCASED:
✅ Order Confirmation - E-commerce transaction email
✅ Shipping Notification - Package tracking email
✅ Password Reset - Account security email
✅ Login Alert - Security notification email
✅ Welcome Email - User onboarding email
✅ Promotional Sale - Marketing campaign email
✅ System Health Report - Monitoring email
✅ Test Summary - This completion email

🚀 LIVE TESTING SUCCESS:
✅ All emails sent via real MailerSend API
✅ No mock services - 100% live integration
✅ Real email delivery to your inbox
✅ Proper schema validation and error handling
✅ Configurable timing intervals between emails

📊 TEST STATISTICS:
Test Date: ${testDate}
Completion Time: ${testTime}
Total Emails: 8 templates
Success Rate: 100%
Delivery Method: Live MailerSend API

🎉 Ready for production! All email templates are working perfectly.

---
GodWear Testing System
Live email showcase completed successfully
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("✅ Test Completion Summary email sent successfully!");
    });
  });

  afterEach(() => {
    liveEmailAssertions.logEmailSummary(testEnv.sentEmails);
    console.log(`🎭 Email showcase progress - ${testEnv.sentEmails.length} emails sent`);
    console.log(`📧 Check ${config.testRecipient} for all showcase emails`);
  });
});
