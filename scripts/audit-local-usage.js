const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// --- CONFIGURATION ---
// Files that SHOULD have been migrated to @repo/shared. Keep editing this list
// as you migrate more things. This part is a targeted check.
const filesToAudit = {
  web: [
    'services/KeyManager.jsx', 'services/schemeEngine.jsx', 'services/SecurityTracker.jsx',
    'services/sync.jsx', 'services/WhatsappSender.jsx', 'services/cloudService.jsx',
    'utils/calculateTax.jsx', 'utils/currency.jsx', 'utils/formateDate.jsx',
  ],
  desktop: [
    'services/KeyManager.jsx', 'services/schemeEngine.jsx', 'services/SecurityTracker.jsx',
    'services/sync.jsx', 'services/WhatsappSender.jsx', 'services/cloudService.jsx',
    'utils/calculateTax.jsx', 'utils/currency.jsx', 'utils/formateDate.jsx',
  ],
  mobile: [
    'services/Api.js', 'services/ApiService.js', 'services/cloudsyncservices.js', 'services/config.js',
    'services/encryptionservice.js', 'services/FeatureControlServices.js', 'services/GstValidator.js',
    'services/ImageOCR.js', 'services/index.js', 'services/KeyManager.js', 'services/QrService.js',
    'services/SchemeEngine.js', 'services/SecurityTracker.js', 'services/sync.js', 'services/WhatsappService.js',
    'utils/barcodeGenerator.js', 'utils/calculateTax.js', 'utils/currency.js', 'utils/Featureutils.js',
    'utils/formateDate.js', 'utils/GstCalculator.js', 'utils/index.js', 'utils/pdfParser.js',
  ],
};

const appPaths = {
  web: path.join(projectRoot, 'apps', 'web', 'src'),
  desktop: path.join(projectRoot, 'apps', 'desktop', 'src'),
  mobile: path.join(projectRoot, 'apps', 'mobile', 'src'),
};

// Files that are "entry points" - nothing imports them directly (bundler/OS does),
// so they should never be flagged as unused even if no import matches them.
const ENTRY_POINT_PATTERNS = [
  /^index\.(js|jsx|ts|tsx)$/i,
  /^main\.(js|jsx|ts|tsx)$/i,
  /^app\.(js|jsx|ts|tsx)$/i,
  /^_app\.(js|jsx|ts|tsx)$/i,
  /^_document\.(js|jsx|ts|tsx)$/i,
  /^layout\.(js|jsx|ts|tsx)$/i,
  /^page\.(js|jsx|ts|tsx)$/i,
  /\.test\.(js|jsx|ts|tsx)$/i,
  /\.spec\.(js|jsx|ts|tsx)$/i,
  /\.d\.ts$/i,
];

const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.expo', '.next', 'coverage'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function getAllFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory() && !ignoreDirs.includes(file)) {
          results = results.concat(getAllFiles(filePath));
        } else if (stat && stat.isFile() && CODE_EXTENSIONS.includes(path.extname(filePath))) {
          results.push(filePath);
        }
      } catch (e) {
        // permission denied etc - skip
      }
    });
  } catch (e) {
    // dir unreadable - skip
  }
  return results;
}

// Strips single-line and block comments so commented-out imports don't
// create false "still used" results.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Extracts every quoted import/require specifier from a file's contents:
//   import x from '../services/Api'
//   import('../services/Api')
//   require('../services/Api.js')
//   export * from './Api'
function extractSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /(?:import|export)[^'"()]*?from\s*['"]([^'"]+)['"]/g,
    /(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(content)) !== null) {
      specifiers.push(m[1]);
    }
  });
  return specifiers;
}

// Resolves a specifier used inside `fromFile` against the filesystem,
// mimicking how a bundler would resolve it (extension-less imports, index files).
function resolveSpecifier(specifier, fromFile) {
  if (!specifier.startsWith('.')) return null; // skip bare/package imports for now
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    ...CODE_EXTENSIONS.map(ext => base + ext),
    ...CODE_EXTENSIONS.map(ext => path.join(base, 'index' + ext)),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return path.resolve(c);
    }
  }
  return null;
}

function isEntryPoint(fileFullPath) {
  const base = path.basename(fileFullPath);
  return ENTRY_POINT_PATTERNS.some(re => re.test(base));
}

// Builds a map: absolute file path -> array of absolute file paths that import it.
function buildUsageGraph(allFiles) {
  const usedBy = new Map(); // resolved absolute path -> Set of importer paths
  allFiles.forEach(f => usedBy.set(f, new Set()));

  allFiles.forEach(file => {
    let content;
    try {
      content = stripComments(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return;
    }
    const specifiers = extractSpecifiers(content);
    specifiers.forEach(spec => {
      const resolved = resolveSpecifier(spec, file);
      if (resolved && usedBy.has(resolved)) {
        usedBy.get(resolved).add(file);
      }
    });
  });

  return usedBy;
}

function rel(p) {
  return path.relative(projectRoot, p).replace(/\\/g, '/');
}

console.log('🚀 Starting Local Usage Audit...');
console.log(`Project Root: ${projectRoot}`);
console.log('=============================================');

// ---------- PART 1: targeted migration list check ----------
for (const appName in filesToAudit) {
  console.log(`\n📂 [Migration Check] ${appName.charAt(0).toUpperCase() + appName.slice(1)} App...`);
  const appSrcPath = appPaths[appName];
  const filesToCheck = filesToAudit[appName];

  if (!fs.existsSync(appSrcPath)) {
    console.log(`  - ⚠️ Source directory not found: ${appSrcPath}`);
    continue;
  }

  const allAppFiles = getAllFiles(appSrcPath);
  const usageGraph = buildUsageGraph(allAppFiles);

  filesToCheck.forEach(fileRelPath => {
    const fileFullPath = path.resolve(path.join(appSrcPath, fileRelPath));
    const fileExists = fs.existsSync(fileFullPath);
    const usage = usageGraph.has(fileFullPath)
      ? Array.from(usageGraph.get(fileFullPath)).map(rel)
      : [];

    console.log(`  🔍 Checking: '${fileRelPath.replace(/\\/g, '/')}'`);

    if (!fileExists && usage.length === 0) {
      console.log('    🟢 Migrated: File does not exist and no usages found. (Perfect!)');
    } else if (!fileExists && usage.length > 0) {
      console.log(`    🔴 CRITICAL: File deleted, but still imported in ${usage.length} place(s). This will cause a crash!`);
      usage.forEach(u => console.log(`      - ${u}`));
    } else if (fileExists && usage.length > 0) {
      console.log(`    🟡 Needs Migration: File exists and is used in ${usage.length} place(s).`);
      usage.forEach(u => console.log(`      - ${u}`));
    } else if (fileExists && usage.length === 0) {
      console.log('    🟠 Safe to Delete: File exists but is not used anywhere.');
    }
  });
}

// ---------- PART 2: full-app orphan/unused file scan ----------
console.log('\n=============================================');
console.log('🕵️  Full App Scan: looking for ANY unused file (not just the migration list)...');

for (const appName in appPaths) {
  const appSrcPath = appPaths[appName];
  if (!fs.existsSync(appSrcPath)) continue;

  console.log(`\n📂 [Full Scan] ${appName.charAt(0).toUpperCase() + appName.slice(1)} App...`);
  const allAppFiles = getAllFiles(appSrcPath);
  const usageGraph = buildUsageGraph(allAppFiles);

  const orphans = allAppFiles.filter(f => {
    if (isEntryPoint(f)) return false;
    const importers = usageGraph.get(f);
    return !importers || importers.size === 0;
  });

  if (orphans.length === 0) {
    console.log('  ✅ No orphaned files found.');
  } else {
    console.log(`  🟠 ${orphans.length} file(s) not imported anywhere (excluding entry points like index/App/page/tests):`);
    orphans.forEach(f => console.log(`      - ${rel(f)}`));
  }
}

console.log('\n=============================================');
console.log('✅ Audit Complete.');
console.log('💡 Notes & Next Steps:');
console.log('   - "🔴 CRITICAL" = broken import, fix immediately before anything else.');
console.log('   - "🟡 Needs Migration" = still used locally, point these imports to @repo/shared.');
console.log('   - "🟠 Safe to Delete" = not referenced by any relative import.');
console.log('   - Full Scan orphans can still be false positives if something imports them via a');
console.log('     path alias (e.g. "@/services/Api") instead of a relative "../" path, or if a');
console.log('     dynamic string is built at runtime. Grep the filename manually before deleting.');