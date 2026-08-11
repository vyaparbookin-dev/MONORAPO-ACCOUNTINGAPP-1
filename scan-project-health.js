const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIRECTORIES_TO_SCAN = [
  path.join(ROOT_DIR, 'apps', 'mobile'),
  path.join(ROOT_DIR, 'apps', 'web'),
  path.join(ROOT_DIR, 'apps', 'desktop'),
  path.join(ROOT_DIR, 'apps', 'backend'),
  path.join(ROOT_DIR, 'packages', 'shared')
];

const IGNORE_DIRS = ['node_modules', '.expo', 'dist', 'build', '.git', 'assets', 'public'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Regex Patterns
// FIX: Added 'export ... from' to the regex so it catches shared package exports
const IMPORT_REGEX = /(?:import\s+.*?from\s+['"]([^'"]+)['"])|(?:import\s+['"]([^'"]+)['"])|(?:require\s*\(\s*['"]([^'"]+)['"]\s*\))|(?:export\s+.*?from\s+['"]([^'"]+)['"])/g;
const API_CALL_REGEX = /(?:getData|postData|putData|deleteData|api\.get|api\.post|api\.put|api\.delete|api\.patch)\s*\(\s*['"]([^'"]+)['"]/g;
const BACKEND_ROUTE_REGEX = /app\.use\s*\(\s*['"](\/api\/[^'"]+)['"]/g;
const LOCAL_STORAGE_REGEX = /localStorage\.(getItem|setItem|removeItem|clear)/;
const SQLITE_REGEX = /(?:window\.electron\.db|dbService)/;

// State Trackers
const allScannedFiles = new Set();
const usedFiles = new Set();
const brokenImports = [];
const caseMismatches = [];
const frontendApiCalls = new Set();
const backendRoutes = new Set();
const codeSmells = [];
const actionItems = [];
const envVarUsages = new Set();
const definedEnvVars = new Set();
const envIssues = [];
const localStorageFiles = new Set();
const sqliteFiles = new Set();
const directApiFiles = new Set();

console.log("🚀 Starting Monorepo Health Scan...\n");

// --- UTILS ---
function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        results = results.concat(getAllFiles(fullPath));
      }
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        results.push(fullPath);
        allScannedFiles.add(fullPath);
      }
    }
  });
  return results;
}

function checkExactCaseExistence(absolutePath) {
  const dir = path.dirname(absolutePath);
  const base = path.basename(absolutePath);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.includes(base);
}

function resolveImportPath(baseDir, importPath) {
  const targetPath = path.resolve(baseDir, importPath);
  
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      for (let ext of EXTENSIONS) {
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

// --- PHASE 1: COLLECT FILES & ENV VARS ---
let filesToScan = [];
DIRECTORIES_TO_SCAN.forEach(dir => {
  filesToScan = filesToScan.concat(getAllFiles(dir));
});

const envExamplePath = path.join(ROOT_DIR, 'apps', 'backend', 'src', 'config', '.env');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.trim().startsWith('#')) definedEnvVars.add(line.split('=')[0].trim());
  });
}

// Set Entry Points as "Used" so they don't show up in Unused list
filesToScan.forEach(f => {
  const name = path.basename(f).toLowerCase();
  if (['app.js', 'app.jsx', 'index.js', 'index.jsx', 'server.js', 'main.js', 'main.cjs', 'main.jsx', 'vite.config.js', 'metro.config.js', 'tailwind.config.js', 'postcss.config.js', 'seed.js', 'preload.js'].includes(name)) {
    usedFiles.add(f);
  }
});

// --- PHASE 2: SCAN CONTENT ---
filesToScan.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(ROOT_DIR, file);
  
  // 1. Check Imports
  let importMatch;
  while ((importMatch = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = importMatch[1] || importMatch[2] || importMatch[3] || importMatch[4];
    
    if (importPath && (importPath.startsWith('.') || importPath.startsWith('/'))) {
      const resolvedPath = resolveImportPath(path.dirname(file), importPath);
      
      if (!resolvedPath) {
        brokenImports.push({ file: path.relative(ROOT_DIR, file), importPath });
      } else {
        usedFiles.add(resolvedPath); // Mark file as used
        if (!checkExactCaseExistence(resolvedPath)) {
          caseMismatches.push({ file: path.relative(ROOT_DIR, file), importPath });
        }
      }
    }
  }

  // 2. Check API Calls (Frontend)
  if (file.includes('apps\\mobile') || file.includes('apps\\web') || file.includes('apps\\desktop') || file.includes('packages\\shared')) {
    let apiMatch;
    while ((apiMatch = API_CALL_REGEX.exec(content)) !== null) {
      let endpoint = apiMatch[1];
      // Normalize endpoint for comparison
      if (endpoint.startsWith('/api')) endpoint = endpoint.replace('/api', '');
      const baseRoute = endpoint.split('?')[0].split('/')[1]; // e.g. /billing/123 -> billing
      if (baseRoute) frontendApiCalls.add(baseRoute);
    }
  }

  // 3. Extract Backend Routes (Backend)
  if (file.includes('server.js')) {
    let routeMatch;
    while ((routeMatch = BACKEND_ROUTE_REGEX.exec(content)) !== null) {
      let route = routeMatch[1]; // e.g. /api/billing
      const baseRoute = route.replace('/api/', ''); // billing
      backendRoutes.add(baseRoute);
    }
  }

  // 4. Check for console.log, alert, etc.
  if (!file.includes('scan-project-health.js')) {
    const smellRegex = /(console\.(log|warn|error)|alert)\s*\(/g;
    let smellMatch;
    while ((smellMatch = smellRegex.exec(content)) !== null) {
      codeSmells.push({ file: relPath, type: smellMatch[1] });
    }
  }

  // 5. Check for TODO/FIXME comments
  const todoRegex = /\/\/\s*(TODO|FIXME)/gi;
  if (todoRegex.test(content)) {
    actionItems.push(relPath);
  }

  // 6. Collect all process.env usages
  const envRegex = /process\.env\.(\w+)/g;
  let envMatch;
  while ((envMatch = envRegex.exec(content)) !== null) {
    envVarUsages.add(envMatch[1]);
  }

  // 7. Offline-First Architecture Check (Desktop UI Check)
  if (relPath.includes('desktop') && !relPath.includes('main') && !relPath.includes('dist')) {
    if (LOCAL_STORAGE_REGEX.test(content)) localStorageFiles.add(relPath);
    if (SQLITE_REGEX.test(content)) sqliteFiles.add(relPath);
    
    // Check direct API usage outside of services
    const isServiceFile = relPath.includes('services') || relPath.includes('api.js');
    if (!isServiceFile && /(?:api\.get|api\.post|api\.put|api\.delete|api\.patch)\s*\(/.test(content)) {
      directApiFiles.add(relPath);
    }
  }
});

// --- PHASE 3: PROCESS RESULTS ---

console.log("--------------------------------------------------");
console.log(`📊 SCAN RESULTS`);
console.log("--------------------------------------------------");

// 1. Broken Imports
if (brokenImports.length > 0) {
  console.log("❌ BROKEN IMPORTS (File missing or path is wrong):");
  brokenImports.forEach(b => {
    console.log(`   - In ${b.file} -> imported '${b.importPath}'`);
  });
  console.log("");
} else {
  console.log("✅ No broken imports found.\n");
}

// 2. Case Mismatches
if (caseMismatches.length > 0) {
  console.log("⚠️ CASE MISMATCHES (Works on Windows, fails on Linux/Vercel/Expo):");
  caseMismatches.forEach(m => {
    console.log(`   - In ${m.file} -> imported '${m.importPath}'`);
  });
  console.log("");
} else {
  console.log("✅ No case mismatches found.\n");
}

// 3. Advanced Orphan/Unlinked Files Detection
const unlinkedScreens = [];
const unlinkedControllers = [];
const unlinkedRoutes = [];
const unlinkedComponents = [];
const otherUnused = [];

allScannedFiles.forEach(file => {
  if (!usedFiles.has(file)) {
    const relPath = path.relative(ROOT_DIR, file);
    
    // Ignore structural folders that don't always need direct imports
    if (relPath.includes('model\\') || relPath.includes('models\\') || relPath.includes('config\\') || relPath.includes('scripts')) return;

    if (relPath.includes('screens') || relPath.includes('pages')) {
      unlinkedScreens.push(relPath);
    } else if (relPath.includes('controllers')) {
      unlinkedControllers.push(relPath);
    } else if (relPath.includes('routes')) {
      unlinkedRoutes.push(relPath);
    } else if (relPath.includes('components')) {
      unlinkedComponents.push(relPath);
    } else {
      otherUnused.push(relPath);
    }
  }
});

console.log("👻 UNLINKED FILES DETECTED (Created but forgotten to be imported/linked):");
if (unlinkedScreens.length === 0 && unlinkedControllers.length === 0 && unlinkedRoutes.length === 0) {
  console.log("   ✅ All Screens, Controllers, and Routes are properly linked!");
}
if (unlinkedScreens.length > 0) {
  console.log("\n   📱 Unlinked Frontend Screens (Forgot to add to Navigation/Routes?):");
  unlinkedScreens.forEach(f => console.log(`      - ${f}`));
}
if (unlinkedControllers.length > 0 || unlinkedRoutes.length > 0) {
  console.log("\n   ⚙️ Unlinked Backend Files (Forgot to import in server.js or routes?):");
  unlinkedControllers.forEach(f => console.log(`      - ${f} (Controller)`));
  unlinkedRoutes.forEach(f => console.log(`      - ${f} (Route)`));
}
console.log("");

// 4. API Route Check
console.log("🌐 API ROUTE CHECK (Frontend calls vs Backend definitions):");
const missingInBackend = [];
frontendApiCalls.forEach(call => {
  // Special dynamic ones we know
  if (['auth', 'company', 'generate'].includes(call)) return; 
  
  if (!backendRoutes.has(call)) {
    missingInBackend.push(call);
  }
});

if (missingInBackend.length > 0) {
  console.log("   ⚠️ Frontend is calling these base routes, but they might not exist in backend server.js:");
  missingInBackend.forEach(r => console.log(`      - /api/${r}`));
} else {
  console.log("   ✅ All frontend API base calls seem to have a matching backend route.");
}

// 5. Code Smells Report
if (codeSmells.length > 0) {
  console.log("\n🧹 CODE SMELLS (Consider removing for production):");
  const smellSummary = {};
  codeSmells.forEach(s => {
    smellSummary[s.file] = (smellSummary[s.file] || 0) + 1;
  });
  Object.entries(smellSummary).forEach(([file, count]) => {
    console.log(`   - Found ${count} instance(s) in ${file}`);
  });
  console.log("");
} else {
  console.log("✅ No console.log/alert statements found.\n");
}

// 6. Action Items Report
if (actionItems.length > 0) {
  console.log("📝 ACTION ITEMS (TODOs/FIXMEs found):");
  actionItems.forEach(f => console.log(`   - ${f}`));
  console.log("");
} else {
  console.log("✅ No TODO/FIXME comments found.\n");
}

// 7. Environment Variable Check
envVarUsages.forEach(v => { if (!definedEnvVars.has(v) && !['NODE_ENV', 'PUBLIC_URL'].includes(v)) envIssues.push(v); });
if (envIssues.length > 0) {
  console.log("🔑 MISSING ENV VARIABLES (Used in code but not in .env file):");
  envIssues.forEach(v => console.log(`   - process.env.${v}`));
  console.log("   (Please add them to 'apps/backend/src/config/.env' to avoid runtime errors)\n");
} else {
  console.log("✅ All environment variables seem to be defined.\n");
}

// 8. Offline Architecture Report
console.log("🛠️  OFFLINE-FIRST ARCHITECTURE STATUS (Desktop App):");

if (localStorageFiles.size > 0) {
  console.log("\n   ❌ Files still using 'localStorage' (Need Refactoring to SQLite):");
  localStorageFiles.forEach(f => console.log(`      - ${f}`));
} else {
  console.log("\n   ✅ No 'localStorage' usage found in Desktop App!");
}

if (directApiFiles.size > 0) {
  console.log("\n   ⚠️ UI Files still using Direct API calls (Should use dbService + SyncQueue):");
  directApiFiles.forEach(f => console.log(`      - ${f}`));
} else {
  console.log("\n   ✅ No Direct API calls found in UI components!");
}

if (sqliteFiles.size > 0) {
  console.log("\n   ✅ Files successfully upgraded to SQLite (dbService / window.electron.db):");
  sqliteFiles.forEach(f => console.log(`      - ${f}`));
}
console.log("");

console.log("\n--------------------------------------------------");
console.log("Done! Run this script anytime to keep your project clean.");