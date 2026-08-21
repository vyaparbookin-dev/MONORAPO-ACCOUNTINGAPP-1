const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.resolve(__dirname, '../node_modules/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt'),
  path.resolve(__dirname, '../apps/mobile/node_modules/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt')
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('appContext.throwingActivity')) {
      content = content.replace(/appContext\.throwingActivity/g, '(appContext.currentActivity ?: throw Exceptions.MissingActivity())');
      fs.writeFileSync(file, content);
      console.log('✅ Patched:', file);
    }
  }
}
