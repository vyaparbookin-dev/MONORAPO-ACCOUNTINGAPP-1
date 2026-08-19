// Mobile App Configuration
// Use your LAN IP for physical device testing; localhost only works on the simulator/emulator.
import { setBaseUrl } from '@repo/shared/src/services/api.native';
import { Platform } from 'react-native'; 
import Constants from 'expo-constants';

const IS_WEB = Platform.OS === 'web';
const LOCALHOST_API = 'http://127.0.0.1:5001/api';
const PRODUCTION_API = 'https://monorapo-accountingapp-1.onrender.com/api';

const manifest = Constants.expoConfig;
const hostUri = manifest?.hostUri;
const HOST_IP = hostUri ? hostUri.split(':')[0] : null;
const LAN_API = HOST_IP ? `http://${HOST_IP}:5001/api` : null;

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || process.env.REACT_APP_API_URL;
const IS_PRODUCTION = !__DEV__;

const resolveApiBaseUrl = () => {
  if (IS_PRODUCTION) return PRODUCTION_API;
  if (IS_WEB) return LOCALHOST_API;
  // If Expo hostUri is available (physical device running Expo Go on LAN), dynamically use that IP
  if (LAN_API) return LAN_API;
  if (ENV_API_URL) return ENV_API_URL;
  return LOCALHOST_API;
};

export const API_BASE_URL = resolveApiBaseUrl();

// This is the crucial step: configure the shared axios instance with the correct URL
setBaseUrl(API_BASE_URL);

console.log("API Base URL set to:", API_BASE_URL);
console.log("Expo hostUri:", hostUri || "Not available");

export default {
  API_BASE_URL,
  TIMEOUT: 10000,
};
