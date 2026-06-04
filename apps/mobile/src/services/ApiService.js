import { api, setBaseUrl } from '@repo/shared/api.native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 🔥 Dynamically decide API URL based on platform
// Web (Browser) ke liye localhost, aur Mobile (Android/iOS) ke liye IP address.
const LOCAL_WEB_URL = 'http://localhost:5001/api';
const NETWORK_URL = 'http://10.161.124.215:5001/api'; // Check if your PC IP has changed!
const FORCED_API_URL = Platform.OS === 'web' ? LOCAL_WEB_URL : NETWORK_URL;

setBaseUrl(FORCED_API_URL);
console.log('🚀 Mobile API Base URL FORCED to:', FORCED_API_URL);

export const RAZORPAY_KEY_ID = Constants.expoConfig?.extra?.RAZORPAY_KEY_ID || Constants.manifest?.extra?.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || null;

// NOTE: We removed the duplicated interceptor here because @repo/shared/api.native.js 
// ALREADY handles attaching the authToken and companyId automatically.

export const getData = async (endpoint) => {
  console.log(`🌐 [API GET REQUEST] Trying to connect to: ${FORCED_API_URL}${endpoint}`);
  try {
    // Shared API handles token automatically via interceptors
    const data = await api.get(endpoint);
    // WRAPPER FIX: Wrap data back in object to match old mobile app expectation (response.data)
    console.log(`✅ [API GET SUCCESS] Data received from: ${endpoint}`);
    return { data };
  } catch (error) {
    console.error(`\n❌❌ [API GET ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error(`🚨 NETWORK ISSUE: Your app cannot reach the backend at ${FORCED_API_URL}.`);
      console.error("👉 TIP: Check if Backend is running, and your Mobile & Laptop are on the SAME Wi-Fi.");
    }
    throw error;
  }
};

export const postData = async (endpoint, body) => {
  console.log(`🌐 [API POST REQUEST] Trying to connect to: ${FORCED_API_URL}${endpoint}`);
  try {
    // Shared API handles token automatically via interceptors
    const data = await api.post(endpoint, body);
    // WRAPPER FIX: Wrap data back in object to match old mobile app expectation (response.data)
    console.log(`✅ [API POST SUCCESS] Data sent to: ${endpoint}`);
    return { data };
  } catch (error) {
    console.error(`\n❌❌ [API POST ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error(`🚨 NETWORK ISSUE: Cannot reach ${FORCED_API_URL}. Check IP and Wi-Fi connection.`);
    }
    throw error;
  }
};

// COMPATIBILITY LAYER: Add methods that match the old Api.js interface
// This fixes "Api.get is not a function" errors in old screens
export const get = getData;
export const post = postData;

export const put = async (endpoint, body) => {
  try {
    const data = await api.put(endpoint, body);
    return { data };
  } catch (error) {
    console.error(`\n❌❌ [API PUT ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    throw error;
  }
};

const del = async (endpoint) => {
  try {
    const data = await api.delete(endpoint);
    return { data };
  } catch (error) {
    console.error(`\n❌❌ [API DELETE ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    throw error;
  }
};

export { del as delete };