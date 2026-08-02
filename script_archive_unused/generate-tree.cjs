const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = __dirname; // Current directory (frontend/web)
// Folders to ignore so the tree doesn't get too big
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode'];
const OUTPUT_FILE = path.join(__dirname, 'project-tree.txt');

let output = `\n📦 Project Structure: ${path.basename(ROOT_DIR)}\n\n`;

function printTree(dir, prefix = '') {
  try {
    const files = fs.readdirSync(dir);
    
    // Filter out ignored folders and hidden files (except .env)
    const filteredFiles = files.filter(file => 
      !IGNORE_DIRS.includes(file) && 
      !(file.startsWith('.') && file !== '.env')
    );

    // Sort: Folders first, then files (for better visibility)
    filteredFiles.sort((a, b) => {
      const aPath = path.join(dir, a);
      const bPath = path.join(dir, b);
      const aIsDir = fs.statSync(aPath).isDirectory();
      const bIsDir = fs.statSync(bPath).isDirectory();
      
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    filteredFiles.forEach((file, index) => {
      const fullPath = path.join(dir, file);
      const isLast = index === filteredFiles.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      
      output += `${prefix}${marker}${file}\n`;

      if (fs.statSync(fullPath).isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        printTree(fullPath, newPrefix);
      }
    });
  } catch (err) {
    output += `Error reading ${dir}: ${err.message}\n`;
  }
}

printTree(ROOT_DIR);
fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✅ File Tree saved to: ${path.basename(OUTPUT_FILE)}`);
