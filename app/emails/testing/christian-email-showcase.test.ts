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

// ============================================================================
// CHRISTIAN GODWEAR EMAIL SHOWCASE - HOLY DESIGN
// ============================================================================

const EmailShowcaseConfigSchema = z.object({
  testRecipient: z.string().email({}),
  fromEmail: z.string().email({}),
  timingInterval: z.number().int().positive(),
});

type EmailShowcaseConfig = z.infer<typeof EmailShowcaseConfigSchema>;

describe("Christian GodWear Email Showcase - Holy Design", () => {
  const config: EmailShowcaseConfig = {
    testRecipient: "njordrenterprises@gmail.com",
    fromEmail: "noreply@godwear.ca",
    timingInterval: 60000, // 60 seconds (1 minute) between emails
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

  describe("Order & Commerce Emails", () => {
    it("should send order confirmation email", async () => {
      console.log("Sending Order Confirmation Email...");
      
      const orderData = createTestEmailData("order-confirmation", {
        customerId: "showcase-customer-001",
        customerEmail: config.testRecipient,
        customerName: "Faithful Customer",
        orderNumber: `BLESSED-${Date.now()}`,
        total: 127.50,
        items: [
          { id: "1", productId: "faith-tee", name: "Faith Performance T-Shirt", sku: "FPT-001", quantity: 1, price: 39.99, variant: "Medium/White" },
          { id: "2", productId: "cross-hoodie", name: "Cross Training Hoodie", sku: "CTH-002", quantity: 1, price: 67.99, variant: "Large/Navy" },
          { id: "3", productId: "blessed-shorts", name: "Blessed Athletic Shorts", sku: "BAS-003", quantity: 1, price: 29.99, variant: "Medium/Black" }
        ]
      });

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Order Confirmation Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Faithful Customer" },
          subject: `Order Blessed & Confirmed - ${orderData.orderNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Order Confirmation - GodWear</title>
              <style>
                @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; padding: 10px !important; }
                  .header { padding: 30px 20px !important; }
                  .header h1 { font-size: 24px !important; }
                  .header .cross { font-size: 24px !important; }
                  .content { padding: 20px !important; }
                  .content h2 { font-size: 20px !important; }
                  .order-details { padding: 20px !important; }
                  .item-row { flex-direction: column !important; align-items: flex-start !important; }
                  .item-price { text-align: left !important; margin-top: 10px !important; }
                  .next-steps { padding: 20px !important; }
                  .footer { padding: 20px !important; }
                  .mobile-stack { display: block !important; width: 100% !important; }
                }
              </style>
            </head>
            <body style="font-family: 'Georgia', serif; padding: 0; margin: 0; background: linear-gradient(135deg, #FEF7ED 0%, #F9FAFB 100%); -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
              <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <!-- Header -->
                <div class="header" style="background: linear-gradient(135deg, #4C1D95 0%, #6B21A8 100%); color: white; padding: 50px 40px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
                  <div class="cross" style="font-size: 28px; margin-bottom: 15px; color: #B45309;">✝</div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; line-height: 1.2;">Order Blessed & Confirmed</h1>
                  <p style="margin: 20px 0 0 0; font-size: 16px; opacity: 0.9; font-style: italic; line-height: 1.4;">"Give thanks in all circumstances" - 1 Thessalonians 5:18</p>
                </div>
                
                <!-- Main Content -->
                <div class="content" style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 30px; border-top: 3px solid #B45309;">
                  
                  <div style="text-align: center; margin-bottom: 35px;">
                    <h2 style="color: #4C1D95; margin: 0; font-size: 24px; font-weight: 300; line-height: 1.3;">Thank You for Your Faith-Filled Purchase</h2>
                    <p style="color: #6B7280; margin: 15px 0 0 0; font-style: italic; line-height: 1.4;">"Whatever you do, work at it with all your heart" - Colossians 3:23</p>
                  </div>
                  
                  <!-- Order Details -->
                  <div class="order-details" style="background: #FEF7ED; padding: 30px; border-radius: 8px; border-left: 4px solid #B45309; margin-bottom: 30px;">
                    <h3 style="color: #4C1D95; margin-top: 0; font-size: 18px;">Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #4C1D95; font-weight: bold; vertical-align: top; width: 40%;">Order Number:</td>
                        <td style="padding: 8px 0; color: #6B7280; word-break: break-word;">${orderData.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4C1D95; font-weight: bold; vertical-align: top;">Customer:</td>
                        <td style="padding: 8px 0; color: #6B7280; word-break: break-word;">${orderData.customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4C1D95; font-weight: bold; vertical-align: top;">Total:</td>
                        <td style="padding: 8px 0; color: #B45309; font-size: 18px; font-weight: bold;">$${orderData.total.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Items -->
                  <h3 style="color: #4C1D95; margin-top: 30px; font-size: 18px;">Your Blessed Items</h3>
                  ${orderData.items.map(item => `
                    <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin: 15px 0; background: #FEFEFE;">
                      <div class="item-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="mobile-stack" style="flex: 1;">
                          <strong style="color: #4C1D95; font-size: 16px; line-height: 1.3;">${item.name}</strong><br>
                          <span style="color: #6B7280; font-size: 14px; line-height: 1.4;">SKU: ${item.sku} | Quantity: ${item.quantity}</span>
                        </div>
                        <div class="item-price" style="text-align: right; flex-shrink: 0; margin-left: 15px;">
                          <span style="color: #B45309; font-size: 18px; font-weight: bold;">$${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                  
                  <!-- Next Steps -->
                  <div class="next-steps" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 25px; border-radius: 8px; margin-top: 30px; border: 1px solid #B45309;">
                    <h4 style="color: #4C1D95; margin-top: 0; line-height: 1.3;">What's Next in Your Journey</h4>
                    <ul style="color: #374151; margin-bottom: 0; line-height: 1.8; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">You'll receive shipping confirmation when your order departs</li>
                      <li style="margin-bottom: 8px;">Track your order's journey in your account</li>
                      <li>Our faithful team is here to serve you</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Footer -->
                <div class="footer" style="text-align: center; color: #6B7280; font-size: 14px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; color: #B45309;">✝</span>
                  </div>
                  <p style="margin: 0 0 10px 0; font-style: italic; color: #4C1D95; line-height: 1.4;">"Be strong and courageous!" - Joshua 1:9</p>
                  <p style="margin: 0 0 15px 0; line-height: 1.4;"><strong>GodWear</strong> | Clothing for the Faithful</p>
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.4;">This is a live email showcase from the GodWear testing system</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
ORDER BLESSED & CONFIRMED

"Give thanks in all circumstances" - 1 Thessalonians 5:18

Thank you for your faith-filled purchase!

ORDER DETAILS:
Order Number: ${orderData.orderNumber}
Customer: ${orderData.customerName}
Total: $${orderData.total.toFixed(2)}

YOUR BLESSED ITEMS:
${orderData.items.map(item => `- ${item.name} (SKU: ${item.sku}) - Qty: ${item.quantity} - $${item.price.toFixed(2)}`).join('\n')}

WHAT'S NEXT:
- You'll receive shipping confirmation when your order departs
- Track your order's journey in your account
- Our faithful team is here to serve you

"Be strong and courageous!" - Joshua 1:9

GodWear | Clothing for the Faithful
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("Order Confirmation email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });

    it("should send cart abandonment email", async () => {
      console.log("Sending Cart Abandonment Email...");

      const result = await sendTestEmailWithTiming(
        testEnv,
        "Cart Abandonment Showcase",
        testEnv.mailerSendService.sendRawEmail({
          recipient: { email: config.testRecipient, name: "Faithful Customer" },
          subject: `Your Sacred Items Await - Complete Your Journey`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cart Abandonment - GodWear</title>
              <style>
                @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; padding: 10px !important; }
                  .header { padding: 30px 20px !important; }
                  .header h1 { font-size: 24px !important; }
                  .header .cross { font-size: 24px !important; }
                  .content { padding: 20px !important; }
                  .content h2 { font-size: 20px !important; }
                  .cart-items { padding: 20px !important; }
                  .item-row { flex-direction: column !important; align-items: flex-start !important; }
                  .item-price { text-align: left !important; margin-top: 10px !important; }
                  .cta-button { padding: 15px 25px !important; font-size: 14px !important; }
                  .special-offer { padding: 20px !important; }
                  .footer { padding: 20px !important; }
                  .mobile-stack { display: block !important; width: 100% !important; }
                }
              </style>
            </head>
            <body style="font-family: 'Georgia', serif; padding: 0; margin: 0; background: linear-gradient(135deg, #FEF7ED 0%, #F9FAFB 100%); -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
              <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <!-- Header -->
                <div class="header" style="background: linear-gradient(135deg, #4C1D95 0%, #6B21A8 100%); color: white; padding: 50px 40px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
                  <div class="cross" style="font-size: 28px; margin-bottom: 15px; color: #B45309;">✝</div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; line-height: 1.2;">Your Sacred Items Await</h1>
                  <p style="margin: 20px 0 0 0; font-size: 16px; opacity: 0.9; font-style: italic; line-height: 1.4;">"Ask and it will be given to you" - Matthew 7:7</p>
                </div>
                
                <!-- Main Content -->
                <div class="content" style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 30px; border-top: 3px solid #B45309;">
                  
                  <div style="text-align: center; margin-bottom: 35px;">
                    <h2 style="color: #4C1D95; margin: 0; font-size: 24px; font-weight: 300; line-height: 1.3;">Complete Your Faith Journey</h2>
                    <p style="color: #6B7280; margin: 15px 0 0 0; font-style: italic; line-height: 1.4;">You left some blessed items in your cart. Don't let this opportunity pass by.</p>
                  </div>
                  
                  <!-- Cart Items -->
                  <div class="cart-items" style="background: #FEF7ED; padding: 30px; border-radius: 8px; border-left: 4px solid #B45309; margin-bottom: 30px;">
                    <h3 style="color: #4C1D95; margin-top: 0; font-size: 18px;">Items Waiting for You</h3>
                    
                    <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin: 15px 0; background: #FEFEFE;">
                      <div class="item-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="mobile-stack" style="flex: 1;">
                          <strong style="color: #4C1D95; font-size: 16px; line-height: 1.3;">Faith Performance T-Shirt</strong><br>
                          <span style="color: #6B7280; font-size: 14px; line-height: 1.4;">Size: Medium | Color: White</span>
                        </div>
                        <div class="item-price" style="text-align: right; flex-shrink: 0; margin-left: 15px;">
                          <span style="color: #B45309; font-size: 18px; font-weight: bold;">$39.99</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin: 15px 0; background: #FEFEFE;">
                      <div class="item-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="mobile-stack" style="flex: 1;">
                          <strong style="color: #4C1D95; font-size: 16px; line-height: 1.3;">Cross Training Hoodie</strong><br>
                          <span style="color: #6B7280; font-size: 14px; line-height: 1.4;">Size: Large | Color: Navy</span>
                        </div>
                        <div class="item-price" style="text-align: right; flex-shrink: 0; margin-left: 15px;">
                          <span style="color: #B45309; font-size: 18px; font-weight: bold;">$67.99</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Call to Action -->
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="#" class="cta-button" style="background: linear-gradient(135deg, #4C1D95 0%, #6B21A8 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(76, 29, 149, 0.3); font-size: 16px; line-height: 1.2;">
                      Complete Your Purchase
                    </a>
                  </div>
                  
                  <!-- Special Offer -->
                  <div class="special-offer" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 25px; border-radius: 8px; margin-top: 30px; border: 1px solid #B45309; text-align: center;">
                    <h4 style="color: #4C1D95; margin-top: 0; line-height: 1.3;">Limited Time Blessing</h4>
                    <p style="color: #374151; margin: 15px 0; font-size: 16px; line-height: 1.4;">Use code <strong style="background: white; padding: 8px 16px; border-radius: 6px; color: #4C1D95; font-family: monospace; word-break: break-all;">FAITHFUL10</strong> for 10% off</p>
                    <p style="color: #6B7280; margin: 0; font-size: 14px; font-style: italic; line-height: 1.4;">Valid for 24 hours - because faith rewards the faithful</p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div class="footer" style="text-align: center; color: #6B7280; font-size: 14px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; color: #B45309;">✝</span>
                  </div>
                  <p style="margin: 0 0 10px 0; font-style: italic; color: #4C1D95; line-height: 1.4;">"Faith without works is dead" - James 2:26</p>
                  <p style="margin: 0 0 15px 0; line-height: 1.4;"><strong>GodWear</strong> | Clothing for the Faithful</p>
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.4;">This is a live email showcase from the GodWear testing system</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
YOUR SACRED ITEMS AWAIT

"Ask and it will be given to you" - Matthew 7:7

Complete Your Faith Journey

You left some blessed items in your cart. Don't let this opportunity pass by.

ITEMS WAITING FOR YOU:
- Faith Performance T-Shirt (Size: Medium, Color: White) - $39.99
- Cross Training Hoodie (Size: Large, Color: Navy) - $67.99

LIMITED TIME BLESSING:
Use code FAITHFUL10 for 10% off
Valid for 24 hours - because faith rewards the faithful

Complete Your Purchase: [Link]

"Faith without works is dead" - James 2:26

GodWear | Clothing for the Faithful
          `,
        })
      );

      await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
      liveEmailAssertions.verifyRecipient(result, config.testRecipient);
      
      console.log("Cart Abandonment email sent successfully!");
      await waitForMilliseconds(config.timingInterval);
    });
  });
});
