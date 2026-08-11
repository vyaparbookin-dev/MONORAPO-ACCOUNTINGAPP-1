const fs = require('fs');
const path = require('path');

// जिन फोल्डर्स/फाइल्स को चेक करना है
const SRC_DIR = path.join(__dirname, 'src');
const APP_JS = path.join(__dirname, 'app.js');
const filesToScan = [APP_JS];

// सारे JS/JSX फाइल्स को ढूंढने का फंक्शन
function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

if (fs.existsSync(SRC_DIR)) {
  filesToScan.push(...getAllFiles(SRC_DIR));
}

// Import और Require को पकड़ने वाला Regex
const IMPORT_REGEX = /(?:import\s+.*?from\s+['"]([^'"]+)['"])|(?:import\s+['"]([^'"]+)['"])|(?:require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];

let hasErrors = false;

// फाइल का Exact Case (Capital/Small) चेक करने का फंक्शन
function checkExactCaseExistence(absolutePath) {
  const dir = path.dirname(absolutePath);
  const base = path.basename(absolutePath);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.includes(base); // यह Exact Match (Case-sensitive) चेक करता है
}

function resolveImportPath(baseDir, importPath) {
  const targetPath = path.resolve(baseDir, importPath);
  
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      for (let ext of ['.js', '.jsx', '.ts', '.tsx']) {
        const indexFile = path.join(targetPath, `index${ext}`);
        if (fs.existsSync(indexFile)) return indexFile;
      }
    } else {
      return targetPath;
    }
  }

  for (let ext of EXTENSIONS) {
    const pathWithExt = targetPath + ext;
    if (fs.existsSync(pathWithExt)) return pathWithExt;
  }
  return null;
}

console.log("🔍 Scanning for broken imports and case-mismatches in Mobile App...\n");

filesToScan.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3];
    
    // सिर्फ Local/Relative फाइल्स को चेक करें
    if (importPath && (importPath.startsWith('.') || importPath.startsWith('/'))) {
      const resolvedPath = resolveImportPath(path.dirname(file), importPath);
      
      if (!resolvedPath) {
        console.log(`❌ BROKEN LINK in: ${path.relative(__dirname, file)}`);
        console.log(`   -> Cannot find file: '${importPath}'\n`);
        hasErrors = true;
      } else {
        const isExactCase = checkExactCaseExistence(resolvedPath);
        if (!isExactCase) {
          console.log(`⚠️ CASE MISMATCH in: ${path.relative(__dirname, file)}`);
          console.log(`   -> You imported: '${importPath}' (Please check Capital/Small letters)\n`);
          hasErrors = true;
        }
      }
    }
  }
});

if (!hasErrors) console.log("✅ All imports and links look perfect! No broken links or case mismatches found.");
else console.log("🚨 Please fix the above errors!");