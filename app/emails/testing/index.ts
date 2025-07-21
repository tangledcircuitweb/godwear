/**
 * Email Testing Suite
 * 
 * This file exports all testing utilities and provides a CLI for running tests.
 */

// Export all testing utilities
export * from "./test-utils";
export * from "./visual-testing";

// Import test runners
import { renderAllTemplatesForVisualTesting } from "./visual-testing";

/**
 * Available test commands
 */
const commands = {
  /**
   * Render all templates for visual testing
   */
  "render-templates": () => {
    console.log("Rendering all email templates for visual testing...");
    renderAllTemplatesForVisualTesting();
    console.log("Done!");
  },
};

/**
 * Command-line interface
 */
if (require.main === module) {
  const command = process.argv[2];
  
  if (!command) {
    console.log("Available commands:");
    Object.keys(commands).forEach(cmd => console.log(`  - ${cmd}`));
    process.exit(1);
  }
  
  if (command in commands) {
    commands[command as keyof typeof commands]();
  } else {
    console.error(`Unknown command: ${command}`);
    console.log("Available commands:");
    Object.keys(commands).forEach(cmd => console.log(`  - ${cmd}`));
    process.exit(1);
  }
}
