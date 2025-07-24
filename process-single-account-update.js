import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processSingleTemplate() {
  try {
    console.log('🔄 Processing account-update template with consistent theme...');
    
    // Read the template
    const templatePath = path.join(__dirname, 'app/emails/templates/account/account-update.html');
    let templateContent = await fs.readFile(templatePath, 'utf-8');
    
    console.log(`📏 Raw template size: ${Math.round(templateContent.length / 1024)} KB`);
    
    // Mock data for account update
    const mockData = {
      firstName: "Sarah",
      updateType: "Email Address",
      oldValue: "sarah.old@example.com",
      newValue: "sarah.grace@example.com",
      updateDate: "January 23, 2025",
      updateTime: "3:15 PM EST",
      logoUrl: "https://godwear.com/logo.png",
      supportEmail: "blessings@godwear.com",
      currentYear: 2025,
      unsubscribeUrl: "https://godwear.com/unsubscribe",
      privacyUrl: "https://godwear.com/privacy",
      termsUrl: "https://godwear.com/terms"
    };
    
    // Process template with mock data
    const processTemplate = (content, data) => {
      let processed = content;
      
      const replaceValue = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            replaceValue(value, `${prefix}${key}.`);
          } else {
            const regex = new RegExp(`{{${prefix}${key}}}`, 'g');
            processed = processed.replace(regex, String(value));
          }
        });
      };
      
      replaceValue(data);
      
      // Handle conditional blocks
      processed = processed.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
        const value = data[condition.trim()];
        return value ? content : '';
      });
      
      return processed;
    };
    
    const processedTemplate = processTemplate(templateContent, mockData);
    
    console.log(`📏 Processed template size: ${Math.round(processedTemplate.length / 1024)} KB`);
    
    // Verify theme compliance
    const hasCorrectTheme = processedTemplate.includes('--glass-white: rgba(255, 255, 255, 0.25)');
    const hasGlassmorphism = processedTemplate.includes('backdrop-filter: blur');
    const hasResponsive = processedTemplate.includes('@media screen and (max-width: 600px)');
    
    console.log(`🎨 Theme: ${hasCorrectTheme ? '✅' : '❌'}`);
    console.log(`✨ Glass: ${hasGlassmorphism ? '✅' : '❌'}`);
    console.log(`📱 Responsive: ${hasResponsive ? '✅' : '❌'}`);
    
    // Save processed template
    const outputPath = path.join(__dirname, 'app/emails/testing/processed-account-update.html');
    await fs.writeFile(outputPath, processedTemplate, 'utf-8');
    
    console.log('💾 Saved: processed-account-update.html');
    console.log('✅ Account-update template processed with consistent theme!');
    
    // Show a snippet to verify
    const snippet = processedTemplate.substring(0, 500);
    console.log('\n📋 Template snippet:');
    console.log(snippet + '...');
    
  } catch (error) {
    console.error('❌ Error processing template:', error);
  }
}

processSingleTemplate();
