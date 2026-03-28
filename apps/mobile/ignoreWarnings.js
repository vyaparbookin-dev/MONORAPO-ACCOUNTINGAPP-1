import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  const originalError = console.error;

  const shouldIgnore = (args) => {
    const msg = args[0];
    if (typeof msg !== 'string') return false;
    
    return (
      msg.includes('shadow* style props') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('unstable_transformProfile')
    );
  };

  console.warn = (...args) => {
    if (shouldIgnore(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldIgnore(args)) return;
    originalError(...args);
  };
}