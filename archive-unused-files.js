const fs = require('fs');
const path = require('path');

// फालतू फाइलों की लिस्ट जो अभी ऐप में इस्तेमाल नहीं हो रही हैं
const filesToArchive = [
  // 1. पुरानी UI फाइल्स (Old UI Screens)
  'apps/mobile/src/screens/dashboard/DashboardScreen.js',
  'apps/web/src/screens/Reports/StaffPerformancePage.jsx',
  
  // 2. मोबाइल की फालतू डेवलपर स्क्रिप्ट्स (Unused Mobile Scripts)
  'apps/mobile/check-offline-sync.js',
  'apps/mobile/check-imports.js',
  'apps/mobile/scripts/analyze-project.js',
  'apps/mobile/scripts/project-tree.js',
  
  // 3. रूट और डेस्कटॉप की फालतू स्क्रिप्ट्स (Unused Root/Desktop Scripts)
  'apps/desktop/generate-tree.cjs',
  'scan-project.js' // क्योंकि हमारे पास पहले से बेहतर 'scan-project-health.js' है
];

filesToArchive.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(__dirname, '_archive_unused', path.basename(file));
  
  if (fs.existsSync(src)) {
    // आर्काइव फोल्डर बनाएँ (अगर नहीं है)
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    // फाइल को नए फोल्डर में मूव करें
    fs.renameSync(src, dest);
    console.log(`✅ Archived: ${file}`);
  } else {
    console.log(`⚠️ Not found (already moved?): ${file}`);
  }
});

console.log("🎉 Cleanup Complete!");