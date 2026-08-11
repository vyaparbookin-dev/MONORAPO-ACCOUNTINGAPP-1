const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORE_FILES = ['main.jsx', 'index.jsx', 'app.jsx', 'vite.config.js', 'tailwind.config.js'];

console.log("🚀 Starting Project Scan for Unused Imports & Files...\n");

// Helper: Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(SRC_DIR);
const fileUsageCount = {}; // Track how many times a file is imported
allFiles.forEach(f => fileUsageCount[f] = 0);

// Regex to find imports
const importRegex = /import\s+(?:(\w+)|\{([^}]+)\}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;

allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;

  // 1. Check for Unused Imports inside the file
  while ((match = importRegex.exec(content)) !== null) {
    const defaultImport = match[1];
    const namedImports = match[2];
    const namespaceImport = match[3];
    const importPath = match[4];

    // Resolve path to mark file as used
    try {
        if (importPath.startsWith('.')) {
            const dir = path.dirname(filePath);
            const resolved = path.resolve(dir, importPath);
            
            // Try to find the file with extensions or as an index file
            const potentialPaths = [
                ...['', ...EXTENSIONS].map(ext => resolved + ext),
                ...EXTENSIONS.map(ext => path.join(resolved, 'index' + ext))
            ];

            for (let fullPath of potentialPaths) {
                if (fileUsageCount.hasOwnProperty(fullPath)) {
                    fileUsageCount[fullPath]++;
                    break;
                }
            }
        }
    } catch (e) {}

    // Check if imported variables are used
    const variables = [];
    if (defaultImport) variables.push(defaultImport);
    if (namespaceImport) variables.push(namespaceImport);
    if (namedImports) {
        namedImports.split(',').forEach(i => {
            const name = i.trim().split(' as ')[0];
            const alias = i.trim().split(' as ')[1] || name;
            variables.push(alias.trim());
        });
    }

    variables.forEach(variable => {
        // Simple check: does the variable appear more than once?
        // (Once in import, needs at least one more usage)
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        const count = (content.match(regex) || []).length;
        if (count <= 1) {
            console.log(`⚠️  UNUSED IMPORT: ${variable}`);
            console.log(`    File: ${path.relative(SRC_DIR, filePath)}\n`);
        }
    });
  }
});

console.log("--------------------------------------------------");
console.log("🗑️  POTENTIALLY UNUSED FILES (0 Imports found):");
console.log("--------------------------------------------------");

let unusedCount = 0;
Object.keys(fileUsageCount).forEach(file => {
    const filename = path.basename(file);
    if (fileUsageCount[file] === 0 && !IGNORE_FILES.includes(filename.toLowerCase())) {
        console.log(`❌ ${path.relative(SRC_DIR, file)}`);
        unusedCount++;
    }
});

if (unusedCount === 0) {
    console.log("✅ No unused files found!");
} else {
    console.log(`\nFound ${unusedCount} potentially unused files.`);
}
console.log("\nDone.");