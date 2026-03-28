// Mobile App Configuration
// Change IP to your machine's IP address if connecting from physical device
import { setBaseUrl } from '@repo/shared/api.native';
import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';
const LOCALHOST_API = 'http://localhost:5001/api';
// Note: If using Mobile Hotspot, ensure Windows Firewall allows port 5001 access
// Run 'node scripts-all/show-ip.js' every time you reconnect to get the new IP
const NETWORK_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.161.124.215:5001/api'; // Automatically use .env or new IP
const PRODUCTION_API = 'https://api.your-saas-domain.com/api'; // CHANGE THIS FOR DEPLOYMENT

// Auto-detect environment
// __DEV__ is a global variable set by React Native. 
// It's true in development and false in production builds. This is safer than a manual flag.
const IS_PRODUCTION = !__DEV__; 

export const API_BASE_URL = IS_PRODUCTION ? PRODUCTION_API : (IS_WEB ? LOCALHOST_API : NETWORK_API);

// This is the crucial step: configure the shared axios instance with the correct URL
setBaseUrl(API_BASE_URL);

console.log("API Base URL set to:", API_BASE_URL);

// For physical device, change to your machine IP:
// export const API_BASE_URL = 'http://YOUR_MACHINE_IP:5000/api';

export default {
  API_BASE_URL,
  TIMEOUT: 10000,
};
