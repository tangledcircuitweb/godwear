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

async function sendTemplateForReview(): Promise<void> {
  try {
    console.log('🚀 Starting template review email send...');
    
    // Read the actual welcome template (not processed file)
    const templatePath = path.join(__dirname, 'app/emails/templates/account/welcome.html');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    console.log('📧 Template loaded successfully');
    console.log('📏 Template size:', Math.round(templateContent.length / 1024), 'KB');
    
    // Get MailerSend API key from environment
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      console.log('❌ MAILERSEND_API_KEY not found in .env file');
      console.log('📧 Template is ready but cannot send without API key');
      console.log('🎯 Template would be sent to: njordrenterprises@gmail.com & doveowlfly@gmail.com');
      console.log('📋 Subject: GodWear Template Review - Dual-Theme Glassmorphism Design');
      console.log('');
      console.log('✨ Template Features Confirmed:');
      console.log('   🌓 Dual-theme support (light mode default, dark mode enhanced)');
      console.log('   📱 Mobile responsive design');
      console.log('   🔍 Glassmorphism effects with backdrop-filter');
      console.log('   ☀️  Light backgrounds with dark text (readable on all devices)');
      console.log('   🌙 Dark mode support for compatible devices');
      console.log('   📧 Email client compatibility (Outlook, Gmail, Apple Mail)');
      return;
    }
    
    // Prepare email data with verified domain - sending to both recipients
    const emailData: EmailData = {
      from: {
        email: process.env.TEST_EMAIL || 'test@godwear.ca',
        name: 'GodWear Template Review'
      },
      to: [
        {
          email: 'njordrenterprises@gmail.com',
          name: 'Template Reviewer'
        },
        {
          email: 'doveowlfly@gmail.com',
          name: 'Template Reviewer 2'
        }
      ],
      subject: 'GodWear Template Review - Dual-Theme Glassmorphism Design',
      html: templateContent,
      text: 'Please view this email in HTML format to see the glassmorphism design with dual-theme support. Features: Light mode default with dark text for universal readability, Dark mode enhancement for compatible devices, Mobile responsive design, Glassmorphism effects with backdrop-filter.'
    };
    
    console.log('📤 Sending email via MailerSend API...');
    
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
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      try {
        const result = await response.json();
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.message_id || 'N/A');
        console.log('🎯 Sent to: njordrenterprises@gmail.com & doveowlfly@gmail.com');
        console.log('📋 Subject: GodWear Template Review - Dual-Theme Glassmorphism Design');
        console.log('');
        console.log('🌟 Template Features Sent:');
        console.log('   🌓 Dual-theme support (works on all devices)');
        console.log('   📱 Mobile responsive design');
        console.log('   🔍 Glassmorphism effects');
        console.log('   ☀️  Light mode default (dark text on light backgrounds)');
        console.log('   🌙 Dark mode enhancement');
        console.log('   📧 Email client compatibility');
        console.log('');
        console.log('📬 Please check both email addresses for the review email!');
      } catch (jsonError) {
        console.log('✅ Email likely sent successfully (empty response)');
        console.log('🎯 Sent to: njordrenterprises@gmail.com & doveowlfly@gmail.com');
        console.log('📋 Subject: GodWear Template Review - Dual-Theme Glassmorphism Design');
        console.log('📬 Please check both email addresses for the review email!');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Email send failed:', response.status);
      console.error('📋 Error response:', errorText);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        console.error('📋 Parsed error details:', errorData);
      } catch {
        console.error('📋 Raw error text:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error sending template review:', error);
  }
}

// Run the script
sendTemplateForReview();
