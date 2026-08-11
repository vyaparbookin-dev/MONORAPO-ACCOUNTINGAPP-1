const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

console.log("Starting Project Scan for Duplicate Files...");

// Helper: Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
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
  } catch (err) {
    console.error(`Error reading directory ${dirPath}: ${err.message}`);
  }

  return arrayOfFiles;
}

// Helper: Create a hash from file content
function createFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

const allFiles = getAllFiles(SRC_DIR);
const hashes = new Map();

// Group files by hash
allFiles.forEach(filePath => {
  try {
    const hash = createFileHash(filePath);
    if (!hashes.has(hash)) {
      hashes.set(hash, []);
    }
    hashes.get(hash).push(filePath);
  } catch (err) {
    console.error(`Could not process file ${filePath}: ${err.message}`);
  }
});

console.log("-------------------------------------");
console.log("Duplicate File Sets Found:");
console.log("-------------------------------------");

let duplicateSetCount = 0;

hashes.forEach((files, hash) => {
  if (files.length > 1) {
    duplicateSetCount++;
    console.log(`\n[Set ${duplicateSetCount}] - Found ${files.length} identical files:`);
    files.forEach(file => {
      console.log(`  -> ${path.relative(__dirname, file)}`);
    });
  }
});

if (duplicateSetCount === 0) {
  console.log("\nNo duplicate files found in the project.");
} else {
  console.log(`\nFound ${duplicateSetCount} sets of duplicate files.`);
}

console.log("\nDone.");