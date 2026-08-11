const fs = require('fs');
const path = require('path');

// उन फोल्डर्स को इग्नोर करें जो बहुत बड़े हैं या जरूरी नहीं हैं
const IGNORE_DIRS = new Set(['node_modules', '.git', '.expo', 'android', 'ios', 'dist', 'web-build', 'scripts', '__pycache__']);
const IGNORE_FILES = new Set(['.DS_Store', 'package-lock.json', 'yarn.lock', '.gitignore']);

const rootDir = path.join(__dirname, '..'); // मोबाइल फोल्डर का रूट

function printTree(dir, prefix = '') {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    console.log(`${prefix}└── [Error reading directory: ${e.code}]`);
    return;
  }

  const filteredFiles = files.filter(file => !IGNORE_DIRS.has(file) && !IGNORE_FILES.has(file));

  filteredFiles.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const isLast = index === filteredFiles.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (e) {
      console.log(`${prefix}${marker}${file} [Error stating file]`);
      return;
    }

    console.log(`${prefix}${marker}${file}`);

    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(fullPath, newPrefix);
    }
  });
}

console.log(`📦 Mobile Project Structure: ${path.basename(rootDir)}\n`);
console.log('.');
printTree(rootDir);
