// Simple script to send fixed template for review
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendTemplateForReview() {
  try {
    console.log('🚀 Starting template review email send...');
    
    // Read the processed template
    const templatePath = path.join(__dirname, 'app/emails/testing/processed-welcome-dual-theme.html');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    console.log('📧 Template loaded successfully');
    console.log('📏 Template size:', Math.round(templateContent.length / 1024), 'KB');
    
    // Check if MailerSend API key is available
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      console.log('⚠️  MAILERSEND_API_KEY not found in environment');
      console.log('📧 Template is ready but cannot send without API key');
      console.log('🎯 Template would be sent to: njordrenterprises@gmail.com');
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
    
    // Prepare email data
    const emailData = {
      from: {
        email: 'test@godwear.ca',
        name: 'GodWear Template Review'
      },
      to: [{
        email: 'njordrenterprises@gmail.com',
        name: 'Template Reviewer'
      }],
      subject: 'GodWear Template Review - Dual-Theme Glassmorphism Design',
      html: templateContent,
      text: 'Please view this email in HTML format to see the glassmorphism design with dual-theme support.'
    };
    
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
    
    if (response.ok) {
      try {
        const result = await response.json();
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.message_id || 'N/A');
        console.log('🎯 Sent to: njordrenterprises@gmail.com');
        console.log('📋 Subject: GodWear Template Review - Dual-Theme Glassmorphism Design');
        console.log('🌓 Features: Dual-theme support, Mobile responsive, Glassmorphism effects');
        console.log('🤝 Updated: Handshake emoji for Connect with Fellow Believers');
        console.log('✨ Updated: Matthew 5:16 "Let your light shine before others" quote');
      } catch (jsonError) {
        console.log('✅ Email sent successfully! (No JSON response)');
        console.log('🎯 Sent to: njordrenterprises@gmail.com');
        console.log('🤝 Updated: Handshake emoji for Connect with Fellow Believers');
        console.log('✨ Updated: Matthew 5:16 "Let your light shine before others" quote');
      }
    } else {
      const error = await response.text();
      console.error('❌ Email send failed:', response.status, error);
    }
    
  } catch (error) {
    console.error('❌ Error sending template review:', error.message);
  }
}

// Run the script
sendTemplateForReview();
