const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Usage Finder Script (Node.js Version)...");

const rootDir = path.resolve(__dirname, '..');
console.log(`Project Root: ${rootDir}`);
console.log("=============================================");

const checks = [
    {
        appName: "Web App",
        path: "apps/web/src",
        files: [
            "services/KeyManager.jsx",
            "services/schemeEngine.jsx",
            "services/SecurityTracker.jsx",
            "services/sync.jsx",
            "services/WhatsappSender.jsx",
            "services/cloudService.jsx",
            "utils/calculateTax.jsx",
            "utils/currency.jsx",
            "utils/formateDate.jsx"
        ]
    },
    {
        appName: "Desktop App",
        path: "apps/desktop/src",
        files: [
            "services/KeyManager.jsx",
            "services/schemeEngine.jsx",
            "services/SecurityTracker.jsx",
            "services/sync.jsx",
            "services/WhatsappSender.jsx",
            "services/cloudService.jsx",
            "utils/calculateTax.jsx",
            "utils/currency.jsx",
            "utils/formateDate.jsx"
        ]
    },
    {
        appName: "Mobile App",
        path: "apps/mobile/src",
        files: [
            // Services
            "services/Api.js",
            "services/ApiService.js",
            "services/cloudsyncservices.js",
            "services/config.js",
            "services/encryptionservice.js",
            "services/FeatureControlServices.js",
            "services/GstValidator.js",
            "services/ImageOCR.js",
            "services/index.js",
            "services/KeyManager.js",
            "services/QrService.js",
            "services/SchemeEngine.js",
            "services/SecurityTracker.js",
            "services/sync.js",
            "services/WhatsappService.js",
            // Utils
            "utils/barcodeGenerator.js",
            "utils/calculateTax.js",
            "utils/currency.js",
            "utils/Featureutils.js",
            "utils/formateDate.js",
            "utils/GstCalculator.js",
            "utils/index.js",
            "utils/pdfParser.js"
        ]
    }
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

checks.forEach(check => {
    const fullPath = path.join(rootDir, check.path);
    console.log(`\n📂 Checking ${check.appName}...`);

    if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ Path not found: ${fullPath}`);
        return;
    }

    const sourceFiles = getAllFiles(fullPath);

    check.files.forEach(fileToCheck => {
        const fileNameWithoutExt = path.parse(fileToCheck).name;
        // Regex to match local imports: from './...' or from '../...' containing the filename
        // FIX: Added [\\\\/] to ensure we match '/sync' and not 'cloudSync'
        const localImportRegex = new RegExp(`from\\s+['"]\\..*[\\\\/]${fileNameWithoutExt}['"]`, 'i');

        console.log(`  🔍 Checking usage of: '${fileToCheck}'`);

        let found = false;
        sourceFiles.forEach(sourceFile => {
            // Skip the file itself
            if (path.basename(sourceFile) === path.basename(fileToCheck)) return;

            try {
                const content = fs.readFileSync(sourceFile, 'utf-8');
                if (localImportRegex.test(content)) {
                    const relativePath = path.relative(fullPath, sourceFile);
                    console.log(`    🟡 Found usage in: src/${relativePath}`);
                    found = true;
                }
            } catch (err) {
                // Ignore read errors
            }
        });

        if (!found) {
            console.log(`    🟢 Safe to delete (No usage found).`);
        }
    });
});

console.log("\n=============================================");
console.log("✅ Scan Complete.");