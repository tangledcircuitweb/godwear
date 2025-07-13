import { Hono } from "hono";
import type { CloudflareBindings } from "../../../../../types/cloudflare";
import type { EmailRequest } from "../../../../../types/email";
import { MailerSendService } from "../../../../lib/mailersend";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", async (c) => {
  try {
    // Check for required environment variables
    if (!c.env.MAILERSEND_API_KEY) {
      return c.json(
        {
          error: "Email service not configured",
          message: "MailerSend API key is missing",
        },
        500
      );
    }

    // Parse request body
    const body: EmailRequest = await c.req.json();

    // Validate required fields
    if (!(body.email && body.name)) {
      return c.json(
        {
          error: "Missing required fields",
          message: "Email and name are required",
        },
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json(
        {
          error: "Invalid email format",
          message: "Please provide a valid email address",
        },
        400
      );
    }

    // Initialize MailerSend service
    const mailerSendService = new MailerSendService(c.env.MAILERSEND_API_KEY);

    // Send welcome email
    await mailerSendService.sendWelcomeEmail(body.email, body.name);

    return c.json({
      success: true,
      message: "Welcome email sent successfully",
      recipient: body.email,
      service: "MailerSend",
    });
  } catch (error) {
    // Handle specific MailerSend errors
    let errorMessage = "Failed to send welcome email";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "Invalid MailerSend API key";
        statusCode = 401;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded";
        statusCode = 429;
      } else if (error.message.includes("quota")) {
        errorMessage = "Email quota exceeded";
        statusCode = 429;
      }
    }

    return c.json(
      {
        error: "Email sending failed",
        message: errorMessage,
        service: "MailerSend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      statusCode as 401 | 429 | 500
    );
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "mailersend-welcome-email",
    timestamp: new Date().toISOString(),
    hasApiKey: !!c.env.MAILERSEND_API_KEY,
  });
});

// Test endpoint for development
app.get("/test", (c) => {
  if (!c.env.MAILERSEND_API_KEY) {
    return c.json(
      {
        error: "MailerSend API key not configured",
        configured: false,
      },
      500
    );
  }

  return c.json({
    message: "MailerSend welcome email service is ready",
    configured: true,
    timestamp: new Date().toISOString(),
  });
});

export default app;
