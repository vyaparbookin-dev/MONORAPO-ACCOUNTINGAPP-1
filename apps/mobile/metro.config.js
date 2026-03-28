const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// प्रोजेक्ट और वर्कस्पेस रूट का पता लगाएँ
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Metro को पूरे Monorepo को देखने (Watch) के लिए कहें
config.watchFolders = [workspaceRoot];

// 2. Node Modules को सही जगह से Resolve करें (Local और Root दोनों)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Shared Package को Force Resolve करें (ताकि @repo/shared मिले)
config.resolver.extraNodeModules = {
  '@repo/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

// 4. यह सुनिश्चित करें कि सिम्लिंक्स (Symlinks) सही से काम करें
config.resolver.disableHierarchicalLookup = true;

// 5. Axios/Crypto Error Fix: Prefer react-native/browser builds over node builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 6. Ensure source extensions are correct
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// 7. Allow WebAssembly (.wasm) files for expo-sqlite on Web
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

module.exports = config;