const fs = require('fs');
const path = require('path');

// 1. Patch expo-document-picker
const docPickerFiles = [
  path.resolve(__dirname, '../node_modules/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt'),
  path.resolve(__dirname, '../apps/mobile/node_modules/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt')
];

for (const file of docPickerFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('appContext.throwingActivity')) {
      content = content.replace(/appContext\.throwingActivity/g, '(appContext.currentActivity ?: throw Exceptions.MissingActivity())');
      fs.writeFileSync(file, content);
      console.log('✅ Patched expo-document-picker:', file);
    }
  }
}

// 2. Patch expo-linking
const linkingFiles = [
  path.resolve(__dirname, '../node_modules/expo-linking/android/src/main/java/expo/modules/linking/ExpoLinkingModule.kt'),
  path.resolve(__dirname, '../apps/mobile/node_modules/expo-linking/android/src/main/java/expo/modules/linking/ExpoLinkingModule.kt')
];

for (const file of linkingFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('OnStartObserving("onURLReceived")')) {
      content = content.replace(/OnStartObserving\("onURLReceived"\)/g, 'OnStartObserving');
      content = content.replace(/OnStopObserving\("onURLReceived"\)/g, 'OnStopObserving');
      fs.writeFileSync(file, content);
      console.log('✅ Patched expo-linking:', file);
    }
  }
}
