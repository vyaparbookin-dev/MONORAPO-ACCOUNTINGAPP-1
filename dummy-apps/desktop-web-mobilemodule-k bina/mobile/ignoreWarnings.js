import { LogBox, Platform } from 'react-native';

// Suppress specific warnings that are known and non-critical.
LogBox.ignoreLogs([
  // Example: 'Warning: Non-serializable values were found in the navigation state.'
  // This is common when passing functions as params, which is sometimes necessary.
  'Non-serializable values were found in the navigation state',

  // Another common warning from third-party libraries
  'VirtualizedLists should never be nested',
]);

// The following logic for web was specific and can be useful.
if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (
      msg.includes('unstable_createElement') ||
      msg.includes('Using Math.random')
    )) return;
    originalWarn(...args);
  };
}