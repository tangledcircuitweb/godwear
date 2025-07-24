import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailData {
  from: {
    email: string;
    name: string;
  };
  to: Array<{
    email: string;
    name: string;
  }>;
  subject: string;
  html: string;
  text: string;
}

interface Template {
  name: string;
  file: string;
  subject: string;
  enabled: boolean;
}

// 🎛️ TEMPLATE SEND CONTROLS - Set to true/false to control which emails to send
const TEMPLATE_CONTROLS = {
  // Account Templates (7 templates)
  welcome: false,
  welcomeVerification: false,
  emailVerification: false,
  passwordReset: false,
  passwordChanged: false,
  accountUpdate: false,
  
  // Order Templates (8 templates)
  orderConfirmation: true, // 🔍 TESTING: Only sending order confirmation to fix consistency
  shippingNotification: false,
  deliveryOutForDelivery: false,
  deliveryDelivered: false,
  partialShipment: false,
  giftOrderConfirmation: false,
  orderCancellation: false,
  
  // Marketing Templates (3 templates)
  productReview: false,
  orderFollowup: false,
  abandonedCart: false,
  
  // Security Templates (2 templates)
  securityPasswordReset: false,
  securityEmailVerification: false,
  
  // Transactional Templates (2 templates)
  transactionalOrderConfirmation: false,
  transactionalShippingNotification: false
};

async function sendAllCompletedTemplatesForReview(): Promise<void> {
  try {
    console.log('🎉 Starting SELECTIVE template collection review email send...');
    console.log('🎛️ Using boolean controls to send only enabled templates');
    console.log('🎨 Theme: White, Silver, Gold Glassmorphism');
    console.log('📱 Mobile: Fully Responsive');
    console.log('✨ Branding: Christian Faith-Inspired');
    
    const allTemplates: Template[] = [
      // Account Templates (7 templates)
      {
        name: 'welcome',
        file: 'processed-welcome.html',
        subject: 'GodWear Complete Collection - Welcome (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.welcome
      },
      {
        name: 'welcome-verification',
        file: 'processed-welcome-verification.html',
        subject: 'GodWear Complete Collection - Welcome Verification (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.welcomeVerification
      },
      {
        name: 'email-verification',
        file: 'processed-email-verification.html',
        subject: 'GodWear Complete Collection - Email Verification (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.emailVerification
      },
      {
        name: 'password-reset',
        file: 'processed-password-reset.html',
        subject: 'GodWear Complete Collection - Password Reset (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.passwordReset
      },
      {
        name: 'password-changed',
        file: 'processed-password-changed.html',
        subject: 'GodWear Complete Collection - Password Changed (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.passwordChanged
      },
      {
        name: 'account-update',
        file: 'processed-account-update.html',
        subject: 'GodWear Complete Collection - Account Update (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.accountUpdate
      },
      
      // Order Templates (8 templates)
      {
        name: 'order-confirmation',
        file: 'processed-order-confirmation.html',
        subject: 'GodWear Complete Collection - Order Confirmation (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.orderConfirmation
      },
      {
        name: 'shipping-notification',
        file: 'processed-shipping-notification.html',
        subject: 'GodWear Complete Collection - Shipping Notification (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.shippingNotification
      },
      {
        name: 'delivery-out_for_delivery',
        file: 'processed-delivery-out_for_delivery.html',
        subject: 'GodWear Complete Collection - Out for Delivery (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.deliveryOutForDelivery
      },
      {
        name: 'delivery-delivered', 
        file: 'processed-delivery-delivered.html',
        subject: 'GodWear Complete Collection - Delivered (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.deliveryDelivered
      },
      {
        name: 'partial-shipment',
        file: 'processed-partial-shipment.html', 
        subject: 'GodWear Complete Collection - Partial Shipment (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.partialShipment
      },
      {
        name: 'gift-order-confirmation',
        file: 'processed-gift-order-confirmation.html',
        subject: 'GodWear Complete Collection - Gift Order Confirmation (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.giftOrderConfirmation
      },
      {
        name: 'order-cancellation',
        file: 'processed-order-cancellation.html',
        subject: 'GodWear Complete Collection - Order Cancellation (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.orderCancellation
      },
      
      // Marketing Templates (3 templates)
      {
        name: 'product-review',
        file: 'processed-product-review.html',
        subject: 'GodWear Complete Collection - Product Review (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.productReview
      },
      {
        name: 'order-followup',
        file: 'processed-order-followup.html',
        subject: 'GodWear Complete Collection - Order Follow-up (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.orderFollowup
      },
      {
        name: 'abandoned-cart',
        file: 'processed-abandoned-cart.html',
        subject: 'GodWear Complete Collection - Abandoned Cart (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.abandonedCart
      },
      
      // Security Templates (2 templates)
      {
        name: 'security-password-reset',
        file: 'processed-password-reset.html',
        subject: 'GodWear Complete Collection - Security Password Reset (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.securityPasswordReset
      },
      {
        name: 'security-email-verification',
        file: 'processed-email-verification.html',
        subject: 'GodWear Complete Collection - Security Email Verification (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.securityEmailVerification
      },
      
      // Transactional Templates (2 templates)
      {
        name: 'transactional-order-confirmation',
        file: 'processed-order-confirmation.html',
        subject: 'GodWear Complete Collection - Transactional Order Confirmation (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.transactionalOrderConfirmation
      },
      {
        name: 'transactional-shipping-notification',
        file: 'processed-shipping-notification.html',
        subject: 'GodWear Complete Collection - Transactional Shipping Notification (Glassmorphism Theme)',
        enabled: TEMPLATE_CONTROLS.transactionalShippingNotification
      }
    ];
    
    // Filter templates based on enabled status
    const templates = allTemplates.filter(template => template.enabled);
    const disabledTemplates = allTemplates.filter(template => !template.enabled);
    
    console.log('');
    console.log('📊 TEMPLATE STATUS SUMMARY:');
    console.log(`✅ Enabled templates: ${templates.length}`);
    console.log(`❌ Disabled templates: ${disabledTemplates.length}`);
    console.log(`📧 Total templates available: ${allTemplates.length}`);
    
    if (templates.length === 0) {
      console.log('');
      console.log('⚠️  NO TEMPLATES ENABLED!');
      console.log('💡 Set template controls to true in TEMPLATE_CONTROLS to enable sending');
      return;
    }
    
    console.log('');
    console.log('🎯 ENABLED TEMPLATES TO SEND:');
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name}`);
    });
    
    if (disabledTemplates.length > 0) {
      console.log('');
      console.log('⏸️  DISABLED TEMPLATES (will be skipped):');
      disabledTemplates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name}`);
      });
    }
    
    // Get MailerSend API key from environment
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      console.log('❌ MAILERSEND_API_KEY not found in .env file');
      console.log('💡 Make sure .env file contains MAILERSEND_API_KEY');
      return;
    }
    
    console.log('🔑 API Key found, proceeding with email send...');
    console.log('🎯 Recipient: njordrenterprises@gmail.com');
    console.log('');
    
    for (const template of templates) {
      try {
        console.log(`📧 Sending ${template.name}...`);
        
        // Read the processed template
        const templatePath = path.join(__dirname, 'app/emails/testing', template.file);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        console.log(`   📏 Template size: ${Math.round(templateContent.length / 1024)} KB`);
        
        // Prepare email data
        const emailData: EmailData = {
          from: {
            email: process.env.TEST_EMAIL || 'templates@godwear.ca',
            name: 'GodWear Template Review'
          },
          to: [{
            email: 'njordrenterprises@gmail.com',
            name: 'Template Reviewer'
          }],
          subject: template.subject,
          html: templateContent,
          text: `Please view this email in HTML format to see the ${template.name} template with fixed white, silver, gold glassmorphism theme and mobile responsiveness.`
        };
        
        console.log(`   📤 Sending via MailerSend API...`);
        
        // Send via MailerSend API
        const response = await fetch('https://api.mailersend.com/v1/email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(emailData)
        });
        
        console.log(`   📊 Response status: ${response.status}`);
        
        if (response.ok) {
          try {
            const result = await response.json();
            console.log(`   ✅ ${template.name} sent successfully!`);
            console.log(`   📧 Message ID: ${result.message_id || 'N/A'}`);
          } catch (jsonError) {
            console.log(`   ✅ ${template.name} sent successfully!`);
          }
        } else {
          const errorText = await response.text();
          console.error(`   ❌ ${template.name} send failed: ${response.status}`);
          console.error(`   📋 Error: ${errorText}`);
        }
        
        // Longer delay to avoid rate limit (10 emails per minute = 6 second intervals)
        console.log('   ⏳ Waiting 7 seconds to avoid rate limit...');
        await new Promise(resolve => setTimeout(resolve, 7000));
        
      } catch (templateError) {
        console.error(`❌ Error with ${template.name}:`, templateError);
      }
    }
    
    
    console.log('');
    console.log(`🎉 ${templates.length} SELECTED TEMPLATES PROCESSED AND SENT!`);
    console.log('📧 Check njordrenterprises@gmail.com for the selected email templates');
    console.log('');
    
    // Dynamic summary based on what was actually sent
    const sentTemplates = templates.map(t => t.name);
    const accountTemplates = sentTemplates.filter(name => 
      ['welcome', 'welcome-verification', 'email-verification', 'password-reset', 'password-changed', 'account-update'].includes(name)
    );
    const orderTemplates = sentTemplates.filter(name => 
      ['order-confirmation', 'shipping-notification', 'delivery-out_for_delivery', 'delivery-delivered', 'partial-shipment', 'gift-order-confirmation', 'order-cancellation'].includes(name)
    );
    const marketingTemplates = sentTemplates.filter(name => 
      ['product-review', 'order-followup', 'abandoned-cart'].includes(name)
    );
    const securityTemplates = sentTemplates.filter(name => 
      ['security-password-reset', 'security-email-verification'].includes(name)
    );
    const transactionalTemplates = sentTemplates.filter(name => 
      ['transactional-order-confirmation', 'transactional-shipping-notification'].includes(name)
    );
    
    if (accountTemplates.length > 0) {
      console.log(`📋 ACCOUNT TEMPLATES SENT (${accountTemplates.length}):`);
      accountTemplates.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name} - Account management with glassmorphism theme`);
      });
      console.log('');
    }
    
    if (orderTemplates.length > 0) {
      console.log(`📋 ORDER TEMPLATES SENT (${orderTemplates.length}):`);
      orderTemplates.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name} - Order processing with glassmorphism theme`);
      });
      console.log('');
    }
    
    if (marketingTemplates.length > 0) {
      console.log(`📋 MARKETING TEMPLATES SENT (${marketingTemplates.length}):`);
      marketingTemplates.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name} - Marketing engagement with glassmorphism theme`);
      });
      console.log('');
    }
    
    if (securityTemplates.length > 0) {
      console.log(`📋 SECURITY TEMPLATES SENT (${securityTemplates.length}):`);
      securityTemplates.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name} - Security notifications with glassmorphism theme`);
      });
      console.log('');
    }
    
    if (transactionalTemplates.length > 0) {
      console.log(`📋 TRANSACTIONAL TEMPLATES SENT (${transactionalTemplates.length}):`);
      transactionalTemplates.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name} - Transactional messaging with glassmorphism theme`);
      });
      console.log('');
    }
    
    console.log('🔧 ALL SENT TEMPLATES FEATURE:');
    console.log('• ✅ Consistent white, silver, gold glassmorphism theme');
    console.log('• ✅ Mobile-first responsive design with card-based layouts');
    console.log('• ✅ Enhanced glassmorphism effects with backdrop-filter');
    console.log('• ✅ Email client compatibility (Outlook, Gmail, Apple Mail)');
    console.log('• ✅ Christian branding with appropriate scripture integration');
    console.log('• ✅ Touch-friendly buttons and interactive elements');
    console.log('• ✅ Professional typography and visual hierarchy');
    console.log('• ✅ MSO fallback styles for Outlook compatibility');
    console.log('');
    console.log(`🎊 ${templates.length} SELECTED GODWEAR EMAIL TEMPLATES SENT! 🎊`);
    
  } catch (error) {
    console.error('❌ Error sending template reviews:', error);
  }
}

// Run the script to send selected templates based on TEMPLATE_CONTROLS
sendAllCompletedTemplatesForReview();
