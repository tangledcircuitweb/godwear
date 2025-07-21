import { z } from "zod";
import type { EmailResult } from "../services/email-service";
import type { TransactionalEmailService } from "../services/transactional-email-service";
import { addTrackingData } from "../utils/tracking";
import type { CloudflareBindings } from "../../lib/zod-utils";
import crypto from "crypto";

// ============================================================================
// LOCAL SCHEMAS
// ============================================================================

/**
 * Token information schema
 */
const TokenInfoSchema = z.object({
  token: z.string(),
  expiresAt: z.union([z.string(), z.date()], {}),
  expiresInMinutes: z.number().int().positive(),
});

/**
 * Password reset request schema
 */
const PasswordResetRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  resetUrl: z.string().url(),
  token: TokenInfoSchema,
  ipAddress: z.string(),
  userAgent: z.string(),
  requestedAt: z.union([z.string(), z.date()], {}),
});

/**
 * Email verification request schema
 */
const EmailVerificationRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  verificationUrl: z.string().url(),
  token: TokenInfoSchema,
  welcomeUser: z.boolean().optional(),
});

/**
 * Password changed notification schema
 */
const PasswordChangedNotificationSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  changedAt: z.union([z.string(), z.date()], {}),
  accountSettingsUrl: z.string().url().optional(),
});

/**
 * Account update notification schema
 */
const AccountUpdateNotificationSchema = z.object({
  userId: z.string(),
  email: z.string().email({}),
  name: z.string().optional(),
  updateType: z.enum(["email_change", "profile_update", "security_settings", "other"], {}),
  updateDetails: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  updatedAt: z.union([z.string(), z.date()], {}),
  accountSettingsUrl: z.string().url().optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type TokenInfo = z.infer<typeof TokenInfoSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type EmailVerificationRequest = z.infer<typeof EmailVerificationRequestSchema>;
export type PasswordChangedNotification = z.infer<typeof PasswordChangedNotificationSchema>;
export type AccountUpdateNotification = z.infer<typeof AccountUpdateNotificationSchema>;

/**
 * Account security email service
 */
export class AccountSecurityEmail {
  private emailService: TransactionalEmailService;
  private env: CloudflareBindings;
  private baseUrl: string;
  private logoUrl: string;
  private securityImageUrl: string;

  /**
   * Create a new account security email service
   */
  constructor(emailService: TransactionalEmailService, env: CloudflareBindings) {
    this.emailService = emailService;
    this.env = env;
    
    // Set up base URLs
    this.baseUrl = env.BASE_URL || "https://godwear.com";
    this.logoUrl = env.LOGO_URL || `${this.baseUrl}/images/logo.png`;
    this.securityImageUrl = env.SECURITY_IMAGE_URL || `${this.baseUrl}/images/email/security.png`;
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(request: PasswordResetRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = PasswordResetRequestSchema.parse(request);
      
      // Format dates
      const requestedAt = this.formatDateTime(validatedRequest.requestedAt);
      const expiresAt = this.formatDateTime(validatedRequest.token.expiresAt);
      
      // Format device info
      const device = this.formatUserAgent(validatedRequest.userAgent);
      
      // Generate support URL
      const supportUrl = `${this.baseUrl}/support`;
      
      // Generate help URL
      const helpUrl = `${this.baseUrl}/help/account/password-reset`;
      
      // Generate token hash for display (first 6 chars)
      const tokenHash = this.hashToken(validatedRequest.token.token).substring(0, 6).toUpperCase();
      
      // Send email using the transactional email service
      return this.emailService.sendPasswordResetEmail({
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        resetUrl: validatedRequest.resetUrl,
        logoUrl: this.logoUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        ipAddress: validatedRequest.ipAddress,
        device,
        timestamp: requestedAt,
        expiresAt,
        expiresInMinutes: validatedRequest.token.expiresInMinutes,
        tokenHash,
        supportUrl,
        helpUrl,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "password-reset",
      });
    } catch (error) {
      console.error("Failed to send password reset email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "password-reset",
        recipient: request.email,
        subject: "Reset Your Password",
      };
    }
  }

  /**
   * Send an email verification email
   */
  async sendEmailVerificationEmail(request: EmailVerificationRequest): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = EmailVerificationRequestSchema.parse(request);
      
      // Format dates
      const expiresAt = this.formatDateTime(validatedRequest.token.expiresAt);
      
      // Generate support URL
      const supportUrl = `${this.baseUrl}/support`;
      
      // Generate help URL
      const helpUrl = `${this.baseUrl}/help/account/email-verification`;
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        verificationUrl: validatedRequest.verificationUrl,
        logoUrl: this.logoUrl,
        securityImageUrl: this.securityImageUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        expiresAt,
        expiresInMinutes: validatedRequest.token.expiresInMinutes,
        supportUrl,
        helpUrl,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "email-verification",
        welcomeUser: validatedRequest.welcomeUser,
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "account/email-verification",
        "email-verification"
      );
      
      // Determine template and subject based on whether this is a welcome email
      const templateName = validatedRequest.welcomeUser 
        ? "account/welcome-verification" 
        : "account/email-verification";
      
      const subject = validatedRequest.welcomeUser
        ? "Welcome to GodWear - Verify Your Email"
        : "Verify Your Email Address";
      
      // Send email using raw templated email
      return this.emailService.sendTemplatedEmail({
        templateName,
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send email verification email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "email-verification",
        recipient: request.email,
        subject: "Verify Your Email Address",
      };
    }
  }

  /**
   * Send a password changed notification
   */
  async sendPasswordChangedEmail(request: PasswordChangedNotification): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = PasswordChangedNotificationSchema.parse(request);
      
      // Format dates
      const changedAt = this.formatDateTime(validatedRequest.changedAt);
      
      // Format device info
      const device = this.formatUserAgent(validatedRequest.userAgent);
      
      // Generate account settings URL
      const accountSettingsUrl = validatedRequest.accountSettingsUrl || `${this.baseUrl}/account/settings`;
      
      // Generate support URL
      const supportUrl = `${this.baseUrl}/support`;
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        logoUrl: this.logoUrl,
        securityImageUrl: this.securityImageUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        ipAddress: validatedRequest.ipAddress,
        device,
        timestamp: changedAt,
        accountSettingsUrl,
        supportUrl,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: "password-changed",
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "account/password-changed",
        "password-changed"
      );
      
      // Send email using raw templated email
      return this.emailService.sendTemplatedEmail({
        templateName: "account/password-changed",
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject: "Your Password Has Been Changed",
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send password changed email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "password-changed",
        recipient: request.email,
        subject: "Your Password Has Been Changed",
      };
    }
  }

  /**
   * Send an account update notification
   */
  async sendAccountUpdateEmail(request: AccountUpdateNotification): Promise<EmailResult> {
    try {
      // Validate request
      const validatedRequest = AccountUpdateNotificationSchema.parse(request);
      
      // Format dates
      const updatedAt = this.formatDateTime(validatedRequest.updatedAt);
      
      // Format device info
      const device = this.formatUserAgent(validatedRequest.userAgent);
      
      // Generate account settings URL
      const accountSettingsUrl = validatedRequest.accountSettingsUrl || `${this.baseUrl}/account/settings`;
      
      // Generate support URL
      const supportUrl = `${this.baseUrl}/support`;
      
      // Generate update type display text
      const updateTypeDisplay = this.getUpdateTypeDisplay(validatedRequest.updateType);
      
      // Add tracking data
      const templateData = {
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
          userId: validatedRequest.userId,
        },
        firstName: validatedRequest.name?.split(" ")[0],
        logoUrl: this.logoUrl,
        securityImageUrl: this.securityImageUrl,
        supportEmail: this.env.SUPPORT_EMAIL || "support@godwear.com",
        ipAddress: validatedRequest.ipAddress,
        device,
        timestamp: updatedAt,
        updateType: validatedRequest.updateType,
        updateTypeDisplay,
        updateDetails: validatedRequest.updateDetails,
        accountSettingsUrl,
        supportUrl,
        privacyUrl: `${this.baseUrl}/privacy`,
        termsUrl: `${this.baseUrl}/terms`,
        campaignId: `account-update-${validatedRequest.updateType}`,
      };
      
      // Add tracking data
      const trackedData = addTrackingData(
        templateData,
        validatedRequest.userId,
        "account/account-update",
        `account-update-${validatedRequest.updateType}`
      );
      
      // Send email using raw templated email
      return this.emailService.sendTemplatedEmail({
        templateName: "account/account-update",
        recipient: {
          email: validatedRequest.email,
          name: validatedRequest.name,
        },
        subject: `Your Account ${updateTypeDisplay} Has Been Updated`,
        data: trackedData,
      });
    } catch (error) {
      console.error("Failed to send account update email", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        provider: "account-update",
        recipient: request.email,
        subject: "Your Account Has Been Updated",
      };
    }
  }

  /**
   * Format a date and time for display
   */
  private formatDateTime(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    return dateObj.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
    });
  }

  /**
   * Format user agent string into readable device info
   */
  private formatUserAgent(userAgent: string): string {
    // This is a simplified implementation
    // In a real system, you would use a user-agent parsing library
    
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      return "iOS Device";
    } else if (userAgent.includes("Android")) {
      return "Android Device";
    } else if (userAgent.includes("Windows")) {
      return "Windows Device";
    } else if (userAgent.includes("Mac")) {
      return "Mac Device";
    } else if (userAgent.includes("Linux")) {
      return "Linux Device";
    } else {
      return "Unknown Device";
    }
  }

  /**
   * Get display text for update type
   */
  private getUpdateTypeDisplay(updateType: string): string {
    switch (updateType) {
      case "email_change":
        return "Email Address";
      case "profile_update":
        return "Profile Information";
      case "security_settings":
        return "Security Settings";
      default:
        return "Information";
    }
  }

  /**
   * Hash token for display
   */
  private hashToken(token: string): string {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }
}
