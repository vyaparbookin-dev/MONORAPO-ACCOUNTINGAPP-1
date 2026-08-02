const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');

// Files that inherently require internet (Authentication/Cloud)
const IGNORED_FILES = [
  'LoginScreen.js', 
  'RegisterScreen.js', 
  'ForgotPasswordscreen.js', 
  'KeyrecoveryScreen.js',
  'BackupRestoreScreen.js',
  'BillWiseReport.js',
  'ExpenseReportScreen.js',
  'SalesReportScreen.js',
  'SitewiseReportScreen.js',
  'ProductImageUpload.js',
  'BankReconciliationScreen.js',
  'ImportBillScreen.js',
  'EwayBillScreen.js'
];

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
      if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log("🔍 Scanning Mobile App for Offline Sync (SyncQueue) Implementation...\n");

const allFiles = getAllFiles(SCREENS_DIR);

const completedFiles = [];
const pendingFiles = [];
const readOnlyFiles = [];

allFiles.forEach(file => {
  const fileName = path.basename(file);
  if (IGNORED_FILES.includes(fileName)) return; // Skip auth files

  const content = fs.readFileSync(file, 'utf-8');
  
  // Check if file saves data to backend (POST, PUT, DELETE)
  const makesWriteApiCall = /(postData|putData|deleteData|api\.post|api\.put|api\.delete)/.test(content);
  
  // Check if file uses syncQueue or local DB
  const usesOfflineSync = /syncQueue\.enqueue/.test(content) || /Local\(/.test(content); // e.g. addPartyLocal

  const relativePath = path.relative(__dirname, file);

  if (!makesWriteApiCall) {
    readOnlyFiles.push(relativePath);
  } else if (makesWriteApiCall && usesOfflineSync) {
    completedFiles.push(relativePath);
  } else {
    pendingFiles.push(relativePath);
  }
});

console.log("✅ OFFLINE SYNC COMPLETED IN:");
completedFiles.forEach(f => console.log(`   ✔️  ${f}`));

console.log("\n⚠️ NEEDS ATTENTION (API call exists, but SyncQueue is missing):");
if (pendingFiles.length === 0) {
  console.log("   🎉 ALL CLEAR! No pending files found.");
} else {
  pendingFiles.forEach(f => console.log(`   ❌  ${f}`));
}

console.log(`\nℹ️  Skipped ${readOnlyFiles.length} read-only screens and ${IGNORED_FILES.length} Auth screens.`);
console.log("\nDone.");