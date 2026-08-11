const fs = require('fs');
const path = require('path');

// --- Configuration ---
const ROOT_DIR = path.resolve(__dirname, '..'); // Project root directory
const OUTPUT_FILE = path.join(ROOT_DIR, 'full_structure_tree.txt');

// Folders to completely ignore at any level
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist_electron', // For Electron builds
  'build',
  'coverage',
  '.vscode',
  '.expo', // For Expo/React Native
  '__generated__',
  '_archive_unused' // Your archive folder
]);

// Files to ignore
const IGNORE_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  '.env',
  '.env.local',
  '.env.example'
]);

let output = `📦 Project Structure: ${path.basename(ROOT_DIR)}\n\n`;

function generateTree(dir, prefix = '') {
  try {
    const items = fs.readdirSync(dir);

    const filteredItems = items.filter(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        return !IGNORE_DIRS.has(item);
      }
      return !IGNORE_FILES.has(item);
    });

    filteredItems.forEach((item, index) => {
      const fullPath = path.join(dir, item);
      const isLast = index === filteredItems.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      
      output += `${prefix}${marker}${item}\n`;

      if (fs.statSync(fullPath).isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        generateTree(fullPath, newPrefix);
      }
    });
  } catch (err) {
    // Silently ignore errors for directories that might not exist
  }
}

generateTree(ROOT_DIR);
fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✅ Full project tree saved to: ${path.basename(OUTPUT_FILE)}`);