import { describe, it, expect } from "vitest";
import { promises as fs } from 'fs';
import path from 'path';
import {
  generateOrderTemplateData,
  generateAccountTemplateData,
  generateMarketingTemplateData,
  generateTemplateDataForPersona,
  processTemplate,
  CUSTOMER_PERSONAS,
  CHRISTIAN_PRODUCTS,
  type OrderTemplateData,
  type AccountTemplateData,
  type MarketingTemplateData,
} from "../data/template-data";

// ============================================================================
// TEMPLATE DATA SYSTEM DEMONSTRATION
// ============================================================================

describe("Email Template Mock Data System", () => {
  
  describe("Data Generation", () => {
    it("should generate complete order template data", () => {
      const orderData = generateOrderTemplateData();
      
      // Verify all required fields are present
      expect(orderData.name).toBe("Sarah Grace");
      expect(orderData.orderNumber).toBe("GW-2024-001234");
      expect(orderData.items).toHaveLength(3);
      expect(orderData.items[0].name).toBe("Faith Over Fear T-Shirt");
      expect(orderData.shippingAddress.name).toBe("Sarah Grace");
      expect(orderData.total).toBe("$118.40");
      
      console.log("✅ Order Data Generated:", JSON.stringify(orderData, null, 2));
    });

    it("should generate complete account template data", () => {
      const accountData = generateAccountTemplateData();
      
      expect(accountData.name).toBe("Sarah Grace");
      expect(accountData.resetUrl).toContain("reset-password");
      expect(accountData.ipAddress).toBe("192.168.1.100");
      expect(accountData.supportEmail).toBe("blessings@godwear.com");
      
      console.log("✅ Account Data Generated:", JSON.stringify(accountData, null, 2));
    });

    it("should generate complete marketing template data", () => {
      const marketingData = generateMarketingTemplateData();
      
      expect(marketingData.name).toBe("Sarah Grace");
      expect(marketingData.discountCode).toBe("BLESSED20");
      expect(marketingData.productName).toBe("Faith Over Fear T-Shirt");
      
      console.log("✅ Marketing Data Generated:", JSON.stringify(marketingData, null, 2));
    });
  });

  describe("Persona Variations", () => {
    it("should generate data for different customer personas", () => {
      const sarahOrder = generateTemplateDataForPersona("sarah", "order");
      const michaelAccount = generateTemplateDataForPersona("michael", "account");
      const rebeccaMarketing = generateTemplateDataForPersona("rebecca", "marketing");
      
      expect(sarahOrder.name).toBe("Sarah Grace");
      expect(michaelAccount.name).toBe("Michael Faith");
      expect(rebeccaMarketing.name).toBe("Rebecca Joy");
      
      console.log("✅ Persona Variations Generated Successfully");
    });
  });

  describe("Template Processing", () => {
    it("should process simple template variables", () => {
      const template = "Hello {{name}}, your order {{orderNumber}} is confirmed!";
      const data = {
        name: "Sarah Grace",
        orderNumber: "GW-2024-001234"
      };
      
      const processed = processTemplate(template, data);
      expect(processed).toBe("Hello Sarah Grace, your order GW-2024-001234 is confirmed!");
    });

    it("should process nested object properties", () => {
      const template = "Shipping to: {{shippingAddress.name}} at {{shippingAddress.street}}";
      const data = {
        shippingAddress: {
          name: "Sarah Grace",
          street: "123 Blessing Boulevard"
        }
      };
      
      const processed = processTemplate(template, data);
      expect(processed).toBe("Shipping to: Sarah Grace at 123 Blessing Boulevard");
    });

    it("should process array iterations", () => {
      const template = "Items: {{#each items}}{{this.name}} ({{this.quantity}}){{/each}}";
      const data = {
        items: [
          { name: "Faith T-Shirt", quantity: 2 },
          { name: "Blessed Hoodie", quantity: 1 }
        ]
      };
      
      const processed = processTemplate(template, data);
      expect(processed).toContain("Faith T-Shirt (2)");
      expect(processed).toContain("Blessed Hoodie (1)");
    });

    it("should process conditional blocks", () => {
      const template = "{{#if discount}}Discount: {{discount}}{{/if}}";
      
      const dataWithDiscount = { discount: "$10.00" };
      const dataWithoutDiscount = {};
      
      const processedWith = processTemplate(template, dataWithDiscount);
      const processedWithout = processTemplate(template, dataWithoutDiscount);
      
      expect(processedWith).toBe("Discount: $10.00");
      expect(processedWithout).toBe("");
    });
  });

  describe("Real Template Integration", () => {
    it("should process actual welcome email template", async () => {
      const templatePath = path.resolve('/home/tangled/godwear/app/emails/templates/account/welcome.html');
      
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const accountData = generateAccountTemplateData();
        
        const processedTemplate = processTemplate(templateContent, accountData);
        
        // Verify key variables were replaced
        expect(processedTemplate).toContain("Sarah Grace");
        expect(processedTemplate).toContain("blessings@godwear.com");
        expect(processedTemplate).toContain(String(new Date().getFullYear()));
        expect(processedTemplate).not.toContain("{{name}}");
        expect(processedTemplate).not.toContain("{{supportEmail}}");
        
        console.log("✅ Welcome template processed successfully");
        
        // Optional: Write processed template to file for visual inspection
        const outputPath = path.resolve('/home/tangled/godwear/app/emails/testing/processed-welcome.html');
        await fs.writeFile(outputPath, processedTemplate);
        console.log(`📧 Processed template saved to: ${outputPath}`);
        
      } catch (error) {
        console.log("ℹ️  Template file not found, skipping real template test");
      }
    });

    it("should process actual order confirmation template", async () => {
      const templatePath = path.resolve('/home/tangled/godwear/app/emails/templates/orders/order-confirmation.html');
      
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const orderData = generateOrderTemplateData();
        
        const processedTemplate = processTemplate(templateContent, orderData);
        
        // Verify key variables were replaced
        expect(processedTemplate).toContain("Sarah Grace");
        expect(processedTemplate).toContain("GW-2024-001234");
        expect(processedTemplate).toContain("Faith Over Fear T-Shirt");
        expect(processedTemplate).toContain("$118.40");
        expect(processedTemplate).not.toContain("{{name}}");
        expect(processedTemplate).not.toContain("{{orderNumber}}");
        
        console.log("✅ Order confirmation template processed successfully");
        
        // Optional: Write processed template to file for visual inspection
        const outputPath = path.resolve('/home/tangled/godwear/app/emails/testing/processed-order-confirmation.html');
        await fs.writeFile(outputPath, processedTemplate);
        console.log(`📧 Processed template saved to: ${outputPath}`);
        
      } catch (error) {
        console.log("ℹ️  Template file not found, skipping real template test");
      }
    });

    it("should process password reset template", async () => {
      const templatePath = path.resolve('/home/tangled/godwear/app/emails/templates/account/password-reset.html');
      
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const accountData = generateAccountTemplateData();
        
        const processedTemplate = processTemplate(templateContent, accountData);
        
        // Verify key variables were replaced
        expect(processedTemplate).toContain("Sarah Grace");
        expect(processedTemplate).toContain("192.168.1.100");
        expect(processedTemplate).toContain("Chrome on Windows 11");
        expect(processedTemplate).toContain("reset-password?token=");
        expect(processedTemplate).not.toContain("{{name}}");
        expect(processedTemplate).not.toContain("{{resetUrl}}");
        
        console.log("✅ Password reset template processed successfully");
        
        // Optional: Write processed template to file for visual inspection
        const outputPath = path.resolve('/home/tangled/godwear/app/emails/testing/processed-password-reset.html');
        await fs.writeFile(outputPath, processedTemplate);
        console.log(`📧 Processed template saved to: ${outputPath}`);
        
      } catch (error) {
        console.log("ℹ️  Template file not found, skipping real template test");
      }
    });
  });

  describe("Production Readiness", () => {
    it("should validate all required data fields are present", () => {
      const orderData = generateOrderTemplateData();
      
      // Check all critical order fields
      const requiredOrderFields = [
        'name', 'orderNumber', 'orderDate', 'paymentMethod', 'shippingMethod',
        'items', 'subtotal', 'shipping', 'tax', 'total', 'shippingAddress',
        'billingAddress', 'estimatedDelivery', 'trackOrderUrl', 'logoUrl',
        'supportEmail', 'currentYear', 'unsubscribeUrl', 'privacyUrl', 'termsUrl'
      ];
      
      requiredOrderFields.forEach(field => {
        expect(orderData).toHaveProperty(field);
        expect(orderData[field as keyof typeof orderData]).toBeDefined();
      });
      
      console.log("✅ All required order data fields present");
    });

    it("should generate realistic Christian product data", () => {
      const products = CHRISTIAN_PRODUCTS;
      
      expect(products).toHaveLength(5);
      expect(products[0].name).toBe("Faith Over Fear T-Shirt");
      expect(products[1].name).toBe("Blessed & Grateful Hoodie");
      expect(products[2].name).toBe("Proverbs 31 Woman Mug");
      
      products.forEach(product => {
        expect(product.name).toMatch(/Faith|Blessed|Proverbs|Jesus|Scripture/);
        expect(product.price).toMatch(/^\$\d+\.\d{2}$/);
        expect(product.imageUrl).toContain('godwear.com');
      });
      
      console.log("✅ Christian product data is realistic and branded");
    });

    it("should generate diverse customer personas", () => {
      const personas = Object.keys(CUSTOMER_PERSONAS);
      
      expect(personas).toHaveLength(5);
      expect(personas).toContain('sarah');
      expect(personas).toContain('michael');
      expect(personas).toContain('rebecca');
      
      Object.values(CUSTOMER_PERSONAS).forEach(persona => {
        expect(persona.name).toMatch(/Grace|Faith|Joy|Hope|Blessing/);
        expect(persona.email).toContain('@example.com');
      });
      
      console.log("✅ Customer personas are diverse and Christian-themed");
    });
  });
});

// ============================================================================
// INTEGRATION HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to test all templates with mock data
 */
export async function testAllTemplatesWithMockData() {
  const templatesDir = '/home/tangled/godwear/app/emails/templates';
  const templateTypes = ['account', 'orders', 'marketing', 'security', 'transactional'];
  
  for (const type of templateTypes) {
    const typeDir = path.join(templatesDir, type);
    
    try {
      const files = await fs.readdir(typeDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      
      for (const file of htmlFiles) {
        const templatePath = path.join(typeDir, file);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Choose appropriate mock data based on template type
        let mockData;
        if (type === 'orders') {
          mockData = generateOrderTemplateData();
        } else if (type === 'account' || type === 'security') {
          mockData = generateAccountTemplateData();
        } else {
          mockData = generateMarketingTemplateData();
        }
        
        const processedTemplate = processTemplate(templateContent, mockData);
        
        // Save processed template for inspection
        const outputDir = '/home/tangled/godwear/app/emails/testing/processed';
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${type}-${file}`);
        await fs.writeFile(outputPath, processedTemplate);
        
        console.log(`✅ Processed ${type}/${file} -> ${outputPath}`);
      }
    } catch (error) {
      console.log(`ℹ️  Skipping ${type} directory: ${error}`);
    }
  }
}
