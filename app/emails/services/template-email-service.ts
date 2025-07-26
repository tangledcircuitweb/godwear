import { z } from "zod";
import { promises as fs } from 'fs';
import path from 'path';
import {
  generateOrderTemplateData,
  generateAccountTemplateData,
  generateMarketingTemplateData,
  generateTemplateDataForPersona,
  processTemplate,
  type OrderTemplateData,
  type AccountTemplateData,
  type MarketingTemplateData,
  type CommonTemplateData,
} from "../data/template-data";

// ============================================================================
// EMAIL TEMPLATE SERVICE SCHEMAS
// ============================================================================

const EmailTemplateRequestSchema = z.object({
  templateName: z.string(),
  templateType: z.enum(['account', 'orders', 'marketing', 'security', 'transactional']),
  recipientEmail: z.string().email({}),
  recipientName: z.string(),
  customData: z.record(z.string(), z.unknown()).optional(),
  usePersona: z.enum(['sarah', 'michael', 'rebecca', 'david', 'mary']).optional(),
});

const EmailTemplateResponseSchema = z.object({
  success: z.boolean(),
  templateName: z.string(),
  processedHtml: z.string(),
  processedText: z.string().optional(),
  templateData: z.record(z.string(), z.unknown()),
  error: z.string().optional(),
});

type EmailTemplateRequest = z.infer<typeof EmailTemplateRequestSchema>;
type EmailTemplateResponse = z.infer<typeof EmailTemplateResponseSchema>;

// ============================================================================
// TEMPLATE EMAIL SERVICE
// ============================================================================

export class TemplateEmailService {
  private templatesBasePath: string;

  constructor(templatesBasePath: string = '/home/tangled/godwear/app/emails/templates') {
    this.templatesBasePath = templatesBasePath;
  }

  /**
   * Process an email template with appropriate mock data
   */
  async processEmailTemplate(request: EmailTemplateRequest): Promise<EmailTemplateResponse> {
    try {
      // Validate request
      const validatedRequest = EmailTemplateRequestSchema.parse(request);
      
      // Generate appropriate template data
      const templateData = this.generateTemplateData(validatedRequest);
      
      // Load and process HTML template
      const htmlTemplate = await this.loadTemplate(
        validatedRequest.templateType, 
        validatedRequest.templateName, 
        'html'
      );
      const processedHtml = processTemplate(htmlTemplate, templateData);
      
      // Load and process text template (optional)
      let processedText: string | undefined;
      try {
        const textTemplate = await this.loadTemplate(
          validatedRequest.templateType, 
          validatedRequest.templateName, 
          'txt'
        );
        processedText = processTemplate(textTemplate, templateData);
      } catch (error) {
        // Text template is optional, generate from HTML if not available
        processedText = this.generateTextFromHtml(processedHtml);
      }

      return {
        success: true,
        templateName: validatedRequest.templateName,
        processedHtml,
        processedText,
        templateData,
      };

    } catch (error) {
      return {
        success: false,
        templateName: request.templateName,
        processedHtml: '',
        templateData: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate appropriate template data based on request
   */
  private generateTemplateData(request: EmailTemplateRequest): Record<string, any> {
    let baseData: Record<string, any>;

    // Generate base data based on template type
    switch (request.templateType) {
      case 'orders':
        baseData = request.usePersona 
          ? generateTemplateDataForPersona(request.usePersona, 'order')
          : generateOrderTemplateData();
        break;
      
      case 'account':
      case 'security':
        baseData = request.usePersona
          ? generateTemplateDataForPersona(request.usePersona, 'account')
          : generateAccountTemplateData();
        break;
      
      case 'marketing':
      case 'transactional':
        baseData = request.usePersona
          ? generateTemplateDataForPersona(request.usePersona, 'marketing')
          : generateMarketingTemplateData();
        break;
      
      default:
        baseData = generateAccountTemplateData();
    }

    // Override with recipient-specific data
    baseData['name'] = request.recipientName;
    
    // Merge with any custom data provided
    if (request.customData) {
      baseData = { ...baseData, ...request.customData };
    }

    return baseData;
  }

  /**
   * Load template file from filesystem
   */
  private async loadTemplate(
    templateType: string, 
    templateName: string, 
    extension: 'html' | 'txt'
  ): Promise<string> {
    // Handle both .html and base name formats
    const baseName = templateName.replace(/\.html$/, '');
    const fileName = `${baseName}.${extension}`;
    const templatePath = path.join(this.templatesBasePath, templateType, fileName);
    
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  /**
   * Generate plain text version from HTML (basic implementation)
   */
  private generateTextFromHtml(html: string): string {
    return html
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Convert HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Batch process multiple templates
   */
  async batchProcessTemplates(requests: EmailTemplateRequest[]): Promise<EmailTemplateResponse[]> {
    const results: EmailTemplateResponse[] = [];
    
    for (const request of requests) {
      const result = await this.processEmailTemplate(request);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get available templates for a given type
   */
  async getAvailableTemplates(templateType: string): Promise<string[]> {
    try {
      const typeDir = path.join(this.templatesBasePath, templateType);
      const files = await fs.readdir(typeDir);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Preview template with mock data (for development/testing)
   */
  async previewTemplate(
    templateType: string, 
    templateName: string, 
    persona?: keyof typeof import('../data/template-data').CUSTOMER_PERSONAS
  ): Promise<{ html: string; text?: string; data: Record<string, any> }> {
    const request: EmailTemplateRequest = {
      templateName,
      templateType: templateType as any,
      recipientEmail: 'preview@example.com',
      recipientName: 'Preview User',
      usePersona: persona,
    };

    const result = await this.processEmailTemplate(request);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process template');
    }

    const response: { html: string; text?: string; data: Record<string, any> } = {
      html: result.processedHtml,
      data: result.templateData,
    };
    
    if (result.processedText !== undefined) {
      response.text = result.processedText;
    }
    
    return response;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick function to process a single template
 */
export async function processEmailTemplateQuick(
  templateType: string,
  templateName: string,
  recipientName: string,
  recipientEmail: string,
  customData?: Record<string, any>
): Promise<EmailTemplateResponse> {
  const service = new TemplateEmailService();
  
  return service.processEmailTemplate({
    templateType: templateType as any,
    templateName,
    recipientEmail,
    recipientName,
    customData,
  });
}

/**
 * Quick function to preview a template
 */
export async function previewTemplate(
  templateType: string,
  templateName: string,
  persona?: 'sarah' | 'michael' | 'rebecca' | 'david' | 'mary'
): Promise<{ html: string; text?: string; data: Record<string, any> }> {
  const service = new TemplateEmailService();
  return service.previewTemplate(templateType, templateName, persona);
}

// ============================================================================
// PRODUCTION INTEGRATION HELPERS
// ============================================================================

/**
 * Integration with MailerSend service
 */
export async function sendTemplateEmail(
  templateType: string,
  templateName: string,
  recipientEmail: string,
  recipientName: string,
  customData?: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Process template with mock data
    const templateResult = await processEmailTemplateQuick(
      templateType,
      templateName,
      recipientName,
      recipientEmail,
      customData
    );

    if (!templateResult.success) {
      return {
        success: false,
        error: templateResult.error || 'Failed to process template',
      };
    }

    // Here you would integrate with your actual email service
    // For now, we'll simulate the send
    console.log(`📧 Sending ${templateName} to ${recipientEmail}`);
    console.log(`📝 Subject: Email from GodWear`);
    console.log(`📄 HTML Length: ${templateResult.processedHtml.length} characters`);
    
    // Simulate successful send
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Export types for external use
 */
export type { EmailTemplateRequest, EmailTemplateResponse };
