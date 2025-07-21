import { promises as fs } from "fs";
import { join } from "path";
import Handlebars from "handlebars";

// Cache for compiled templates
const templateCache: Record<string, Handlebars.TemplateDelegate> = {};

/**
 * Register Handlebars helpers
 */
function registerHelpers() {
  // Format currency
  Handlebars.registerHelper("currency", function (value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  });

  // Format date
  Handlebars.registerHelper("formatDate", function (date: string, format: string = "long") {
    const dateObj = new Date(date);
    
    switch (format) {
      case "short":
        return dateObj.toLocaleDateString("en-US");
      case "time":
        return dateObj.toLocaleTimeString("en-US");
      case "long":
      default:
        return dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
  });

  // Conditional helper
  Handlebars.registerHelper("when", function (condition: any, value: any, defaultValue: any) {
    return condition ? value : defaultValue;
  });

  // Truncate text
  Handlebars.registerHelper("truncate", function (text: string, length: number) {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  });
}

// Register helpers on module load
registerHelpers();

/**
 * Read template file from disk
 */
async function readTemplateFile(templatePath: string): Promise<string> {
  try {
    return await fs.readFile(templatePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read template file: ${templatePath}`);
  }
}

/**
 * Compile template with Handlebars
 */
function compileTemplate(templateContent: string, templateName: string): Handlebars.TemplateDelegate {
  try {
    // Check cache first
    if (templateCache[templateName]) {
      return templateCache[templateName];
    }
    
    // Compile and cache template
    const compiled = Handlebars.compile(templateContent);
    templateCache[templateName] = compiled;
    return compiled;
  } catch (error) {
    throw new Error(`Failed to compile template: ${templateName}`);
  }
}

/**
 * Render a template with data
 */
export async function renderTemplate(
  templateName: string,
  data: Record<string, any>,
  templateDir: string = "/app/emails/templates"
): Promise<{ html: string; text: string }> {
  try {
    // Add current year to data if not present
    const templateData = {
      ...data,
      currentYear: data.currentYear || new Date().getFullYear(),
    };

    // Determine template paths
    const htmlTemplatePath = join(templateDir, `${templateName}.html`);
    const textTemplatePath = join(templateDir, `${templateName}.txt`);

    // Read template files
    const [htmlTemplate, textTemplate] = await Promise.all([
      readTemplateFile(htmlTemplatePath),
      readTemplateFile(textTemplatePath),
    ]);

    // Compile and render templates
    const compiledHtml = compileTemplate(htmlTemplate, `${templateName}.html`);
    const compiledText = compileTemplate(textTemplate, `${templateName}.txt`);

    return {
      html: compiledHtml(templateData),
      text: compiledText(templateData),
    };
  } catch (error) {
    throw new Error(
      `Failed to render template ${templateName}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Clear template cache
 */
export function clearTemplateCache(): void {
  Object.keys(templateCache).forEach((key) => {
    delete templateCache[key];
  });
}

/**
 * Get template cache stats
 */
export function getTemplateCacheStats(): { count: number; templates: string[] } {
  return {
    count: Object.keys(templateCache).length,
    templates: Object.keys(templateCache),
  };
}
