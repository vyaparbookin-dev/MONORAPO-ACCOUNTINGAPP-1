const fs = require('fs');
const path = require('path');

// This is the absolute first line. If this doesn't show, the problem is not the script.
console.log("✅✅✅ SCRIPT HAS STARTED. If you see this, Node.js is working. ✅✅✅");

// --- Configuration ---
const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_FILE_PATH = path.join(ROOT_DIR, 'audit-report.txt');
const DIRS_TO_AUDIT = ['utils', 'services'];
const APPS_TO_SCAN = ['backend', 'desktop', 'mobile', 'web'];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build']);

// --- Global Variables ---
let outputBuffer = "";

// --- Main Execution ---
// The script is executed from here. The runAudit() call is the "run command".
runAudit();

// --- Function Definitions ---

// Helper to log to both console and a string buffer
function log(message = "") {
  console.log(message);
  outputBuffer += message + "\n";
}

function runAudit() {
  try {
    log(`📅 Audit Date: ${new Date().toLocaleString()}`);
    log('🚀 Starting Monorepo Shared Usage Audit (Dependency-Free)...');
    log('============================================\n');

    for (const dirName of DIRS_TO_AUDIT) {
        auditDirectory(dirName, log);
    }

    log('============================================');
    log('✅ Audit Complete.');
    
    fs.writeFileSync(REPORT_FILE_PATH, outputBuffer);
    console.log(`\n📄 Report successfully saved to: ${REPORT_FILE_PATH}`);
    
  } catch (error) {
    console.error(`\n❌❌❌ A FATAL ERROR OCCURRED: ${error.message} ❌❌❌`);
    console.error(error.stack);
    // Try to save whatever log we have
    outputBuffer += `\nFATAL ERROR: ${error.stack}`;
    fs.writeFileSync(REPORT_FILE_PATH, outputBuffer);
    console.log(`\n📄 Partial report with error saved to: ${REPORT_FILE_PATH}`);
  }
}

function auditDirectory(dirName, log) {
  log(`--- Auditing Directory: "${dirName}" ---`);

  // 1. Find all files in the shared package
  const sharedDir = path.join(ROOT_DIR, 'packages', 'shared', 'src', dirName);
  const sharedFiles = findFiles(sharedDir, ['.js']);
  log(`\n📂 Found ${sharedFiles.length} files in packages/shared/src/${dirName}:`);
  sharedFiles.forEach(file => log(`  - ${path.basename(file)}`));

  // 2. Find all files in the apps
  const report = { migrated: [], localLogic: [] };
  for (const appName of APPS_TO_SCAN) {
    // Path can be 'src' or 'SRC'
    const appDirStandard = path.join(ROOT_DIR, 'apps', appName, 'src', dirName);
    const appDirUppercase = path.join(ROOT_DIR, 'apps', appName, 'SRC', dirName);
    
    const appFiles = [
        ...findFiles(appDirStandard, ['.js', '.jsx']),
        ...findFiles(appDirUppercase, ['.js', '.jsx'])
    ];

    for (const filePath of appFiles) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(ROOT_DIR, filePath);
            if (content.includes("@repo/shared")) {
                report.migrated.push(relativePath);
            } else {
                report.localLogic.push(relativePath);
            }
        } catch (e) {
            log(`  [Warning] Could not read file: ${filePath}`);
        }
    }
  }

  // --- रिपोर्ट प्रिंट करें ---
  log(`\n📱 Apps "${dirName}" files analysis:`);
  
  if (report.migrated.length > 0) {
    log(`\n  🟢 Migrated to @repo/shared (${report.migrated.length} files):`);
    report.migrated.forEach(file => log(`    - ${file}`));
  }
  if (report.localLogic.length > 0) {
    log(`\n  🟡 Contains Local Logic (${report.localLogic.length} files - Review Required):`);
    report.localLogic.forEach(file => {
      let note = '';
      if (file.includes('barcode') || file.includes('ImagePicker') || file.includes('KeyManager') || file.includes('cloudsync')) {
        note = ' (Likely Platform-Specific, OK to keep)';
      }
      log(`    - ${file}${note}`);
    });
  }
  log('\n');
}

// Non-recursive function to find files
function findFiles(startPath, extensions) {
    const results = [];
    if (!fs.existsSync(startPath)) {
        return results;
    }

    const queue = [startPath];

    while (queue.length > 0) {
        const currentPath = queue.shift();
        try {
            const files = fs.readdirSync(currentPath);
            for (const file of files) {
                const fullPath = path.join(currentPath, file);
                if (IGNORE_DIRS.has(file)) continue;

                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        queue.push(fullPath);
                    } else if (extensions.some(ext => file.endsWith(ext))) {
                        results.push(fullPath);
                    }
                } catch (e) {
                    // Ignore errors for single files (e.g., permission denied)
                }
            }
        } catch (e) {
            // Ignore errors for directories
        }
    }
    return results;
}
