const fs = require('fs').promises;
const path = require('path');

async function testSingleTemplate() {
  try {
    const template = {
      name: "orders/partial-shipment.html",
      type: "order",
      description: "Partial shipment notification with Christian branding",
      biblicalReference: "Ecclesiastes 3:11 - God's perfect timing"
    };
    
    console.log('Testing template:', template.name);
    
    // Read the actual template file
    const templatePath = path.resolve('/home/tangled/godwear/app/emails/templates', template.name);
    console.log('Template path:', templatePath);
    
    const templateHtml = await fs.readFile(templatePath, 'utf-8');
    console.log('Template HTML length:', templateHtml.length);
    console.log('First 200 characters:', templateHtml.substring(0, 200));
    
    console.log('✅ Successfully read template file!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSingleTemplate();
