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
// LOCAL SCHEMAS (AI-First: File-local types with Zod)
// ============================================================================

const TimingTestConfigSchema = z.object({
  testRecipient: z.string().email({}),
  fromEmail: z.string().email({}),
  testIntervals: z.object({
    short: z.number().int().positive(),
    medium: z.number().int().positive(),
    long: z.number().int().positive(),
  }),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

type TimingTestConfig = z.infer<typeof TimingTestConfigSchema>;

// ============================================================================
// EMAIL TIMING SYSTEM TESTS
// ============================================================================

describe("Email Timing System", () => {
  const config: TimingTestConfig = {
    testRecipient: "njordrenterprises@gmail.com",
    fromEmail: "noreply@godwear.ca",
    testIntervals: {
      short: 60000,  // 60 seconds for rate limiting prevention
      medium: 60000, // 60 seconds
      long: 60000,   // 60 seconds
    },
  };

  it("should configure email timing intervals", async () => {
    console.log("🧪 Testing configurable email timing system...");
    
    const testEnv = createLiveEmailTestEnvironment();
    
    // Test configuring different timing intervals
    configureEmailTiming(testEnv, {
      critical: 0,                    // No delay for critical
      high: config.testIntervals.short,     // 10 seconds for high priority
      medium: config.testIntervals.medium,  // 30 seconds for medium priority
      low: config.testIntervals.long,       // 1 minute for low priority
      testing: config.testIntervals.short,  // 10 seconds for testing mode
    });
    
    // Verify configuration was applied
    expect(testEnv.dependencies.env.EMAIL_INTERVAL_CRITICAL).toBe("0");
    expect(testEnv.dependencies.env.EMAIL_INTERVAL_HIGH).toBe(config.testIntervals.short.toString());
    expect(testEnv.dependencies.env.EMAIL_INTERVAL_MEDIUM).toBe(config.testIntervals.medium.toString());
    expect(testEnv.dependencies.env.EMAIL_INTERVAL_LOW).toBe(config.testIntervals.long.toString());
    expect(testEnv.dependencies.env.EMAIL_INTERVAL_TESTING).toBe(config.testIntervals.short.toString());
    expect(testEnv.dependencies.env.EMAIL_TESTING_MODE).toBe("true");
    
    console.log("✅ Email timing configuration test passed!");
  });

  it("should send test email with timing verification", async () => {
    console.log("📧 Testing email send with timing verification...");
    
    const testEnv = createLiveEmailTestEnvironment();
    
    // Configure for quick testing (10 seconds)
    configureEmailTiming(testEnv, {
      testing: config.testIntervals.short, // 10 seconds
    });
    
    // Create test email data
    const emailData = createTestEmailData("order-confirmation", {
      customerId: "timing-test-123",
      customerEmail: config.testRecipient,
      customerName: "Timing Test User",
    });
    
    // Send test email using the queue service with timing
    const startTime = Date.now();
    
    const result = await sendTestEmailWithTiming(
      testEnv,
      "Timing System Test",
      testEnv.mailerSendService.sendRawEmail({
        to: config.testRecipient,
        subject: `⏱️ Email Timing System Test - ${new Date().toLocaleString()}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Timing Test</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px;">
              <h1>⏱️ Email Timing System Test</h1>
              <p>Task 142: Configurable timing intervals implemented</p>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 8px;">
              <h2>🎯 Timing Configuration</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Critical Priority:</td>
                  <td style="padding: 8px;">0ms (no delay)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">High Priority:</td>
                  <td style="padding: 8px;">${config.testIntervals.short}ms (${config.testIntervals.short/1000}s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Medium Priority:</td>
                  <td style="padding: 8px;">${config.testIntervals.medium}ms (${config.testIntervals.medium/1000}s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Low Priority:</td>
                  <td style="padding: 8px;">${config.testIntervals.long}ms (${config.testIntervals.long/1000}s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Testing Mode:</td>
                  <td style="padding: 8px;">${config.testIntervals.short}ms (${config.testIntervals.short/1000}s)</td>
                </tr>
              </table>
              
              <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4 style="color: #155724; margin-top: 0;">✅ Features Implemented</h4>
                <ul style="color: #155724; margin-bottom: 0;">
                  <li>✅ Configurable timing intervals per priority level</li>
                  <li>✅ Environment variable configuration</li>
                  <li>✅ Testing mode with custom intervals</li>
                  <li>✅ Dynamic timing configuration</li>
                  <li>✅ Queue processing with timing enforcement</li>
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
              <p><strong>GodWear Email Timing System</strong></p>
              <p>Configurable intervals between emails for optimal delivery</p>
            </div>
          </body>
          </html>
        `,
        text: `
⏱️ Email Timing System Test

🎯 Timing Configuration:
- Critical Priority: 0ms (no delay)
- High Priority: ${config.testIntervals.short}ms (${config.testIntervals.short/1000}s)
- Medium Priority: ${config.testIntervals.medium}ms (${config.testIntervals.medium/1000}s)
- Low Priority: ${config.testIntervals.long}ms (${config.testIntervals.long/1000}s)
- Testing Mode: ${config.testIntervals.short}ms (${config.testIntervals.short/1000}s)

✅ Features Implemented:
- ✅ Configurable timing intervals per priority level
- ✅ Environment variable configuration
- ✅ Testing mode with custom intervals
- ✅ Dynamic timing configuration
- ✅ Queue processing with timing enforcement

---
GodWear Email Timing System
Configurable intervals between emails for optimal delivery
        `,
      })
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify email was sent successfully
    await liveEmailAssertions.waitForEmailSent(Promise.resolve(result));
    liveEmailAssertions.verifyRecipient(result, config.testRecipient);
    
    // Log timing information
    console.log(`⏱️  Email sent in ${duration}ms`);
    console.log(`📧 Check ${config.testRecipient} for timing system test email`);
    
    // Verify timing tracking
    expect(testEnv.emailTimings.length).toBe(1);
    expect(testEnv.emailTimings[0].emailId).toBe(result.messageId);
    
    console.log("✅ Email timing system test passed!");
  });
});
