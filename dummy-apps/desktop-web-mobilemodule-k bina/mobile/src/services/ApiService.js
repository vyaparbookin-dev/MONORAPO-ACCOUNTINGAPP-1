import { api } from '@repo/shared/src/services/api.native';
import Constants from 'expo-constants';
import { API_BASE_URL } from './config'; // Import the correctly configured URL

// This line is no longer needed because config.js already calls setBaseUrl().
// console.log('🚀 Mobile API Base URL is configured by config.js to:', API_BASE_URL);

export const RAZORPAY_KEY_ID = Constants.expoConfig?.extra?.RAZORPAY_KEY_ID || Constants.manifest?.extra?.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || null;

// NOTE: We removed the duplicated interceptor here because @repo/shared/api.native.js 
// ALREADY handles attaching the authToken and companyId automatically.

export const getData = async (endpoint) => {
  console.log(`🌐 [API GET REQUEST] Trying to connect to: ${API_BASE_URL}${endpoint}`);
  try {
    // Shared API handles token automatically via interceptors
    const response = await api.get(endpoint);
    console.log(`✅ [API GET SUCCESS] Data received from: ${endpoint}`);
    return response; // Return the unwrapped payload directly
  } catch (error) {
    console.error(`\n❌❌ [API GET ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error(`🚨 NETWORK ISSUE: Your app cannot reach the backend at ${API_BASE_URL}.`);
      console.error("👉 TIP: Check if Backend is running, and your Mobile & Laptop are on the SAME Wi-Fi.");
    }
    throw error;
  }
};

export const postData = async (endpoint, body) => {
  console.log(`🌐 [API POST REQUEST] Trying to connect to: ${API_BASE_URL}${endpoint}`);
  try {
    // Shared API handles token automatically via interceptors
    const response = await api.post(endpoint, body);
    console.log(`✅ [API POST SUCCESS] Data sent to: ${endpoint}`);
    return response; // Return the unwrapped payload directly
  } catch (error) {
    console.error(`\n❌❌ [API POST ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error(`🚨 NETWORK ISSUE: Cannot reach ${API_BASE_URL}. Check IP and Wi-Fi connection.`);
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
    const response = await api.put(endpoint, body);
    return response;
  } catch (error) {
    console.error(`\n❌❌ [API PUT ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    throw error;
  }
};

const del = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response;
  } catch (error) {
    console.error(`\n❌❌ [API DELETE ERROR] Failed at: ${endpoint}`);
    console.error(`🔍 Details: ${error.message || error.error || JSON.stringify(error)}`);
    throw error;
  }
};

export { del as delete };