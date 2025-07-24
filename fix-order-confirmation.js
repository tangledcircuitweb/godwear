import { promises as fs } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixOrderConfirmation() {
  try {
    console.log('🔧 Fixing order confirmation template...');
    
    // Read the original template
    const templatePath = path.join(__dirname, 'app/emails/templates/orders/order-confirmation.html');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    console.log('📖 Template read successfully');
    
    // Mock data for processing
    const mockData = {
      orderNumber: 'GW-2025-001',
      logoUrl: 'https://godwear.ca/logo.png',
      customerName: 'John Doe',
      orderDate: 'January 24, 2025',
      items: [
        {
          name: 'Faith Cross T-Shirt',
          variant: 'Large, Navy Blue',
          sku: 'GW-CROSS-L-NAVY',
          quantity: 2,
          price: '$29.99',
          imageUrl: 'https://godwear.ca/products/cross-tshirt.jpg'
        },
        {
          name: 'Blessed Hoodie',
          variant: 'Medium, White',
          sku: 'GW-BLESSED-M-WHITE',
          quantity: 1,
          price: '$49.99',
          imageUrl: 'https://godwear.ca/products/blessed-hoodie.jpg'
        }
      ],
      subtotal: '$109.97',
      shipping: '$9.99',
      tax: '$11.99',
      discount: '$10.00',
      total: '$121.95',
      shippingAddress: {
        name: 'John Doe',
        street: '123 Faith Street',
        street2: 'Apt 4B',
        city: 'Blessed City',
        state: 'BC',
        zip: 'V1A 2B3',
        country: 'Canada'
      },
      billingAddress: {
        name: 'John Doe',
        street: '123 Faith Street',
        street2: 'Apt 4B',
        city: 'Blessed City',
        state: 'BC',
        zip: 'V1A 2B3',
        country: 'Canada'
      },
      estimatedDelivery: 'January 30, 2025',
      trackOrderUrl: 'https://godwear.ca/track/GW-2025-001',
      returnsUrl: 'https://godwear.ca/returns',
      supportEmail: 'support@godwear.com',
      currentYear: '2025',
      unsubscribeUrl: 'https://godwear.ca/unsubscribe',
      privacyUrl: 'https://godwear.ca/privacy',
      termsUrl: 'https://godwear.ca/terms'
    };
    
    // Compile and process the template
    const template = Handlebars.compile(templateContent);
    const processedHtml = template(mockData);
    
    console.log('✅ Template processed successfully');
    
    // Write the processed template
    const outputPath = path.join(__dirname, 'app/emails/testing/processed-order-confirmation.html');
    await fs.writeFile(outputPath, processedHtml, 'utf-8');
    
    console.log('💾 Processed template saved to:', outputPath);
    console.log('📏 Template size:', Math.round(processedHtml.length / 1024), 'KB');
    
    // Verify the structure
    const hasStyleTag = processedHtml.includes('<style>') && processedHtml.includes('</style>');
    const hasBodyTag = processedHtml.includes('<body') && processedHtml.includes('</body>');
    const hasDoctype = processedHtml.includes('<!DOCTYPE html>');
    
    console.log('');
    console.log('🔍 STRUCTURE VERIFICATION:');
    console.log('✅ DOCTYPE:', hasDoctype ? 'Present' : '❌ Missing');
    console.log('✅ Style tags:', hasStyleTag ? 'Present' : '❌ Missing');
    console.log('✅ Body tags:', hasBodyTag ? 'Present' : '❌ Missing');
    
    // Check for raw CSS outside style tags
    const bodyIndex = processedHtml.indexOf('<body');
    const styleEndIndex = processedHtml.indexOf('</style>');
    const headEndIndex = processedHtml.indexOf('</head>');
    
    if (bodyIndex > 0 && styleEndIndex > 0 && headEndIndex > 0) {
      const betweenStyleAndBody = processedHtml.substring(headEndIndex + 7, bodyIndex).trim();
      if (betweenStyleAndBody.length > 0 && betweenStyleAndBody.includes('{')) {
        console.log('❌ WARNING: Raw CSS found between </head> and <body>');
        console.log('Raw content:', betweenStyleAndBody.substring(0, 100) + '...');
      } else {
        console.log('✅ No raw CSS between </head> and <body>');
      }
    }
    
    console.log('');
    console.log('🎉 Order confirmation template fixed and ready for testing!');
    
  } catch (error) {
    console.error('❌ Error fixing template:', error);
  }
}

fixOrderConfirmation();
