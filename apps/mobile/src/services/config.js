// Mobile App Configuration
// Change IP to your machine's IP address if connecting from physical device
import { setBaseUrl } from '@repo/shared/src/services/api.native';
import { Platform } from 'react-native'; 
import Constants from 'expo-constants';

const IS_WEB = Platform.OS === 'web';
const LOCALHOST_API = 'http://localhost:5001/api';
// Note: If using Mobile Hotspot, ensure Windows Firewall allows port 5001 access
// Run 'node scripts-all/show-ip.js' every time you reconnect to get the new IP

// --- DYNAMIC IP DETECTION ---
// This automatically gets your computer's IP address from the Expo bundler.
const manifest = Constants.expoConfig;
const hostUri = manifest?.hostUri;
const NETWORK_API = hostUri ? `http://${hostUri.split(':')[0]}:5001/api` : LOCALHOST_API;

const PRODUCTION_API = 'https://monorapo-accountingapp-1.onrender.com/api'; // Your Deployed Render URL

// Auto-detect environment
// __DEV__ is a global variable set by React Native.
// It's true in development and false in production builds.
const IS_PRODUCTION = !__DEV__;
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || process.env.REACT_APP_API_URL;

export const API_BASE_URL = IS_PRODUCTION
  ? PRODUCTION_API
  : ENV_API_URL
    ? ENV_API_URL
    : (IS_WEB ? LOCALHOST_API : NETWORK_API);

// This is the crucial step: configure the shared axios instance with the correct URL
setBaseUrl(API_BASE_URL);

console.log("API Base URL set to:", API_BASE_URL);

// For physical device, change to your machine IP:
// export const API_BASE_URL = 'http://YOUR_MACHINE_IP:5000/api';

export default {
  API_BASE_URL,
  TIMEOUT: 10000,
};
