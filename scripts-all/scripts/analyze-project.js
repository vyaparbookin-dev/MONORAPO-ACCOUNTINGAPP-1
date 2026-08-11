const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..'); // मोबाइल प्रोजेक्ट का रूट
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.expo', 'android', 'ios', 'dist', 'web-build', 'scripts', '__pycache__']);

// सारी फाइलों की लिस्ट
let allFiles = [];
// सारे इम्पोर्ट्स (Absolute Paths)
let allImports = new Set();
// सारे पैकेज इम्पोर्ट्स (Libraries)
let allPackageImports = new Set();
// टूटे हुए लिंक्स (Broken Imports)
let brokenImports = [];

// package.json लोड करें
let packageJson = {};
try {
  packageJson = require(path.join(projectRoot, 'package.json'));
} catch (e) {
  console.error("⚠️  Could not load package.json. Dependency checks will be skipped.");
}

const installedPackages = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
]);

function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    if (IGNORE_DIRS.has(item)) return;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath);
    } else {
      if (extensions.includes(path.extname(item))) {
        allFiles.push(fullPath);
        extractImports(fullPath);
      }
    }
  });
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Regex to find imports
  const importRegex = /(?:(?:import|export)\s+.*?from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    if (importPath.startsWith('.')) {
      // Local file import
      const resolved = resolveImportPath(importPath, path.dirname(filePath));
      if (resolved) {
        allImports.add(resolved);
      } else {
        // अगर फाइल नहीं मिली, तो यह Broken Link है
        brokenImports.push({ file: filePath, import: importPath });
      }
    } else {
      // Package/Library import
      let packageName = importPath;
      
      // Handle scoped packages (@org/pkg) and deep imports (pkg/utils)
      if (packageName.startsWith('@')) {
        const parts = packageName.split('/');
        if (parts.length >= 2) packageName = `${parts[0]}/${parts[1]}`;
      } else {
        packageName = packageName.split('/')[0];
      }
      
      allPackageImports.add(packageName);
    }
  }
}

function resolveImportPath(importPath, basePath) {
  try {
    const resolvedBase = path.resolve(basePath, importPath);

    // 1. Exact file match
    if (fs.existsSync(resolvedBase) && fs.statSync(resolvedBase).isFile()) return resolvedBase;

    // 2. Extension match
    for (const ext of extensions) {
      if (fs.existsSync(resolvedBase + ext)) return resolvedBase + ext;
    }

    // 3. Directory index match
    for (const ext of extensions) {
      const indexFile = path.join(resolvedBase, 'index' + ext);
      if (fs.existsSync(indexFile)) return indexFile;
    }
  } catch (e) { /* ignore */ }
  return null;
}

// 1. Empty Files Check
function findEmptyFiles() {
  console.log('\n🔍 Checking for Empty Files...');
  let found = false;
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8').trim();
    if (content.length === 0) {
      console.log(`⚠️  Empty: ${path.relative(projectRoot, file)}`);
      found = true;
    }
  });
  if (!found) console.log('✅ No empty files found.');
}

// 2. Orphan Files Check (Unused files)
function findOrphanFiles() {
  console.log('\n🔍 Checking for Unused Files (Orphans)...');
  const entryPoints = ['app.js', 'App.js', 'index.js', 'main.js', '_layout.js', 'App.tsx', 'metro.config.js', 'babel.config.js', 'react-native.config.js'];
  
  let found = false;
  allFiles.forEach(file => {
    const fileName = path.basename(file);
    // Skip entry points and this script itself
    if (file === __filename) return;
    if (entryPoints.includes(fileName)) return;

    if (!allImports.has(file)) {
      console.log(`❓ Potentially Unused: ${path.relative(projectRoot, file)}`);
      found = true;
    }
  });
  if (!found) console.log('✅ No orphan files found.');
}

// 3. Missing Dependencies Check
function findMissingDependencies() {
  console.log('\n🔍 Checking for Missing Libraries (Imported but not installed)...');
  const builtIns = new Set(['fs', 'path', 'os', 'crypto', 'http', 'https', 'stream', 'util', 'events', 'net', 'tls', 'zlib', 'child_process', 'url', 'assert']);
  
  let found = false;
  allPackageImports.forEach(pkg => {
    if (builtIns.has(pkg)) return; // Skip Node.js built-ins
    if (pkg.startsWith('assets') || pkg.startsWith('components')) return; // Skip aliases if any

    if (!installedPackages.has(pkg)) {
      console.log(`❌ Missing Library: ${pkg}`);
      found = true;
    }
  });
  if (!found) console.log('✅ All libraries are installed.');
}

// 4. Broken Links Check (Conflicts)
function findBrokenLinks() {
  console.log('\n🔍 Checking for Broken Links (Import conflicts)...');
  if (brokenImports.length === 0) {
    console.log('✅ No broken links found. All files are linked correctly.');
  } else {
    brokenImports.forEach(item => {
      console.log(`❌ Broken Import in: ${path.relative(projectRoot, item.file)}`);
      console.log(`   ↳ Tries to import: '${item.import}' (File not found)`);
    });
  }
}

console.log(`🚀 Starting Advanced Analysis for: ${path.basename(projectRoot)}\n`);

getAllFiles(projectRoot);
findEmptyFiles();
findOrphanFiles();
findMissingDependencies();
findBrokenLinks();
