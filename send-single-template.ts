import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendSingleTemplate(): Promise<void> {
  try {
    console.log('🚀 Sending account-update template with CONSISTENT THEME...');
    console.log('📧 This should match all other GodWear templates exactly!');
    
    // Get MailerSend API key from environment
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      console.log('❌ MAILERSEND_API_KEY not found in .env file');
      return;
    }
    
    console.log('🔑 API Key found, proceeding with email send...');
    console.log('🎯 Recipient: njordrenterprises@gmail.com');
    console.log('');
    
    // Read the processed template
    const templatePath = path.join(__dirname, 'app/emails/testing/processed-account-update.html');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    console.log(`📏 Template size: ${Math.round(templateContent.length / 1024)} KB`);
    
    // Prepare email data
    const emailData = {
      from: {
        email: process.env.TEST_EMAIL || 'templates@godwear.ca',
        name: 'GodWear Template Review - FIXED'
      },
      to: [{
        email: 'njordrenterprises@gmail.com',
        name: 'Template Reviewer'
      }],
      subject: 'GodWear Template Review - Account Update (FINAL CONSISTENT THEME)',
      html: templateContent,
      text: 'FIXED account-update template - no more raw code, proper HTML rendering with glassmorphism theme and mobile responsiveness.'
    };
    
    console.log('📤 Sending via MailerSend API...');
    
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
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      try {
        const result = await response.json();
        console.log('✅ FIXED account-update template sent successfully!');
        console.log(`📧 Message ID: ${result.message_id || 'N/A'}`);
      } catch (jsonError) {
        console.log('✅ FIXED account-update template sent successfully!');
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Send failed: ${response.status}`);
      console.error(`📋 Error: ${errorText}`);
    }
    
    console.log('');
    console.log('🔧 FIXES APPLIED:');
    console.log('• Fixed malformed HTML/CSS structure that was causing raw code display');
    console.log('• Rebuilt with proper glassmorphism theme (white, silver, gold)');
    console.log('• Added mobile responsiveness with card layouts');
    console.log('• Included security messaging and update details');
    console.log('• Added Christian branding and scripture integration');
    console.log('• Ensured email client compatibility');
    console.log('');
    console.log('📧 Check njordrenterprises@gmail.com for the FIXED account-update template!');
    
  } catch (error) {
    console.error('❌ Error sending template:', error);
  }
}

// Run the script
sendSingleTemplate();
