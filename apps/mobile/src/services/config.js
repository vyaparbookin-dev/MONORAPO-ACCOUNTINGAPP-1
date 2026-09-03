// Mobile App Configuration
import { setBaseUrl } from '@repo/shared/src/services/api.native';
import { Platform } from 'react-native'; 
import Constants from 'expo-constants';

const PRODUCTION_API = 'https://monorapo-accountingapp-1.onrender.com/api';

const manifest = Constants.expoConfig;
const hostUri = manifest?.hostUri;
const HOST_IP = hostUri ? hostUri.split(':')[0] : null;
const LAN_API = HOST_IP ? `http://${HOST_IP}:5001/api` : null;
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || process.env.REACT_APP_API_URL;

const resolveApiBaseUrl = () => {
  if (ENV_API_URL) return ENV_API_URL;
  if (LAN_API && __DEV__) return LAN_API;
  return PRODUCTION_API;
};

export const API_BASE_URL = resolveApiBaseUrl();

// Configure the shared axios instance with the correct URL
setBaseUrl(API_BASE_URL);

console.log("API Base URL set to:", API_BASE_URL);

export default {
  API_BASE_URL,
  TIMEOUT: 15000,
};
