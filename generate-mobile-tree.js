const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, 'apps', 'mobile', 'src');
const OUTPUT_FILE = path.join(__dirname, 'MOBILE_APP_TREE.txt');

function generateTree(dir, prefix = '') {
  let tree = '';
  try {
    const files = fs.readdirSync(dir);
    
    // Folders ko upar aur Files ko niche dikhane ke liye sort karein
    const sortedFiles = files.sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    sortedFiles.forEach((file, index) => {
      const fullPath = path.join(dir, file);
      const isLast = index === sortedFiles.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      
      tree += `${prefix}${marker}${file}\n`;

      if (fs.statSync(fullPath).isDirectory()) {
        tree += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
      }
    });
  } catch (err) {
    console.error(`Error reading ${dir}:`, err.message);
  }
  return tree;
}

console.log("📱 Scanning Mobile App Structure...");
const treeHeader = `📦 Mobile App Active Structure (apps/mobile/src)\n\n`;
fs.writeFileSync(OUTPUT_FILE, treeHeader + generateTree(TARGET_DIR));
console.log(`✅ Done! Nayi file ban gayi hai: MOBILE_APP_TREE.txt\n(Aap is file ko VS Code me open karke apna poora app structure dekh sakte hain)`);