import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountSecurityEmail } from "./account-security";
import type { TransactionalEmailService } from "../services/transactional-email-service";

describe("AccountSecurityEmail", () => {
  // Mock dependencies
  const mockEmailService = {
    sendPasswordResetEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "user@example.com",
      subject: "Reset Your Password",
    }),
    sendTemplatedEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "test-message-id",
      timestamp: new Date().toISOString(),
      provider: "test",
      recipient: "user@example.com",
      subject: "Test Subject",
    }),
  } as unknown as TransactionalEmailService;

  const mockEnv = {
    BASE_URL: "https://test.godwear.com",
    LOGO_URL: "https://test.godwear.com/logo.png",
    SECURITY_IMAGE_URL: "https://test.godwear.com/images/security.png",
    SUPPORT_EMAIL: "support@test.godwear.com",
  };

  // Sample data
  const samplePasswordReset = {
    userId: "user-123",
    email: "user@example.com",
    name: "John Doe",
    resetUrl: "https://test.godwear.com/reset-password?token=abc123",
    token: {
      token: "abc123",
      expiresAt: "2025-07-21T16:00:00Z",
      expiresInMinutes: 60,
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    requestedAt: "2025-07-21T15:00:00Z",
  };

  const sampleEmailVerification = {
    userId: "user-123",
    email: "user@example.com",
    name: "John Doe",
    verificationUrl: "https://test.godwear.com/verify-email?token=abc123",
    token: {
      token: "abc123",
      expiresAt: "2025-07-21T16:00:00Z",
      expiresInMinutes: 60,
    },
  };

  const samplePasswordChanged = {
    userId: "user-123",
    email: "user@example.com",
    name: "John Doe",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    changedAt: "2025-07-21T15:00:00Z",
    accountSettingsUrl: "https://test.godwear.com/account/settings",
  };

  const sampleAccountUpdate = {
    userId: "user-123",
    email: "user@example.com",
    name: "John Doe",
    updateType: "email_change",
    updateDetails: "Email changed from old@example.com to user@example.com",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    updatedAt: "2025-07-21T15:00:00Z",
    accountSettingsUrl: "https://test.godwear.com/account/settings",
  };

  let accountSecurityEmail: AccountSecurityEmail;

  beforeEach(() => {
    vi.clearAllMocks();
    accountSecurityEmail = new AccountSecurityEmail(mockEmailService, mockEnv as any);
  });

  describe("sendPasswordResetEmail", () => {
    it("should send a password reset email successfully", async () => {
      const result = await accountSecurityEmail.sendPasswordResetEmail(samplePasswordReset);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendPasswordResetEmail.mock.calls[0][0];
      expect(callArgs.recipient.email).toBe(samplePasswordReset.email);
      expect(callArgs.recipient.name).toBe(samplePasswordReset.name);
      expect(callArgs.resetUrl).toBe(samplePasswordReset.resetUrl);
      expect(callArgs.ipAddress).toBe(samplePasswordReset.ipAddress);
      expect(callArgs.expiresInMinutes).toBe(samplePasswordReset.token.expiresInMinutes);
    });

    it("should handle errors gracefully", async () => {
      mockEmailService.sendPasswordResetEmail = vi.fn().mockRejectedValue(new Error("Test error"));

      const result = await accountSecurityEmail.sendPasswordResetEmail(samplePasswordReset);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
    });
  });

  describe("sendEmailVerificationEmail", () => {
    it("should send an email verification email successfully", async () => {
      const result = await accountSecurityEmail.sendEmailVerificationEmail(sampleEmailVerification);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("account/email-verification");
      expect(callArgs.recipient.email).toBe(sampleEmailVerification.email);
      expect(callArgs.data.verificationUrl).toBe(sampleEmailVerification.verificationUrl);
      expect(callArgs.data.expiresInMinutes).toBe(sampleEmailVerification.token.expiresInMinutes);
    });

    it("should send a welcome verification email for new users", async () => {
      const result = await accountSecurityEmail.sendEmailVerificationEmail({
        ...sampleEmailVerification,
        welcomeUser: true,
      });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("account/welcome-verification");
      expect(callArgs.subject).toContain("Welcome");
      expect(callArgs.data.welcomeUser).toBe(true);
    });
  });

  describe("sendPasswordChangedEmail", () => {
    it("should send a password changed notification successfully", async () => {
      const result = await accountSecurityEmail.sendPasswordChangedEmail(samplePasswordChanged);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("account/password-changed");
      expect(callArgs.recipient.email).toBe(samplePasswordChanged.email);
      expect(callArgs.data.ipAddress).toBe(samplePasswordChanged.ipAddress);
      expect(callArgs.data.accountSettingsUrl).toBe(samplePasswordChanged.accountSettingsUrl);
    });
  });

  describe("sendAccountUpdateEmail", () => {
    it("should send an account update notification successfully", async () => {
      const result = await accountSecurityEmail.sendAccountUpdateEmail(sampleAccountUpdate);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.templateName).toBe("account/account-update");
      expect(callArgs.recipient.email).toBe(sampleAccountUpdate.email);
      expect(callArgs.data.updateType).toBe(sampleAccountUpdate.updateType);
      expect(callArgs.data.updateDetails).toBe(sampleAccountUpdate.updateDetails);
      expect(callArgs.subject).toContain("Email Address");
    });

    it("should handle different update types", async () => {
      const result = await accountSecurityEmail.sendAccountUpdateEmail({
        ...sampleAccountUpdate,
        updateType: "security_settings",
        updateDetails: "Two-factor authentication enabled",
      });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockEmailService.sendTemplatedEmail.mock.calls[0][0];
      expect(callArgs.data.updateType).toBe("security_settings");
      expect(callArgs.data.updateTypeDisplay).toBe("Security Settings");
      expect(callArgs.subject).toContain("Security Settings");
    });
  });
});
