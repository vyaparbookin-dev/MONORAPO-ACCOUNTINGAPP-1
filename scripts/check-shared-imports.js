const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Shared Import Verification...");

const rootDir = path.resolve(__dirname, '..');

const apps = [
    { name: "Web App", path: "apps/web/src" },
    { name: "Desktop App", path: "apps/desktop/src" },
    { name: "Mobile App", path: "apps/mobile/src" }
];

// Helper function to recursively get all files
function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== "node_modules") {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

apps.forEach(app => {
    const fullPath = path.join(rootDir, app.path);
    console.log(`\n📂 Checking ${app.name}...`);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ Path not found: ${fullPath}`);
        return;
    }

    const files = getAllFiles(fullPath);
    const importingFiles = [];
    
    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            // Check for @repo/shared usage in imports
            if (content.includes('@repo/shared') || content.includes('"@repo/shared"')) {
                importingFiles.push(file);
            }
        } catch (err) {
            // Ignore read errors
        }
    });

    console.log(`  ✅ Found ${importingFiles.length} files importing '@repo/shared'`);
    if (importingFiles.length > 0) {
        importingFiles.forEach(filePath => {
            console.log(`    - ${path.relative(rootDir, filePath)}`);
        });
    }
});

console.log("\n=============================================");
console.log("💡 If counts are high, your migration is working correctly!");