import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of JavaScript files to fix
const filesToFix = [
  'app/client.js',
  'app/entry.server.js',
  'app/routes/_404.js',
  'app/routes/_error.js',
  'app/routes/api/auth/callback.js',
  'app/routes/api/auth/logout.js',
  'app/routes/api/auth/user.js',
  'app/routes/api/notifications/welcome.js',
  'app/server.js'
];

// Function to add a blank line after imports
function fixImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find the last import line
    let lastImportLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportLine = i;
      }
    }
    
    // If we found imports and the next line is not already blank
    if (lastImportLine >= 0 && lastImportLine + 1 < lines.length && lines[lastImportLine + 1].trim() !== '') {
      // Insert a blank line after the last import
      lines.splice(lastImportLine + 1, 0, '');
      
      // Write the modified content back to the file
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log(`Fixed imports in ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process each file
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  fixImports(fullPath);
});

console.log('Import fixing completed!');
