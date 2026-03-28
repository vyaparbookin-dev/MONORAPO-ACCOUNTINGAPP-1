import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper to safely get env vars
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return null;
};

// Get storage based on environment
const getStorage = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn("AsyncStorage read error:", e);
    return null;
  }
};

const setStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn("AsyncStorage write error:", e);
  }
};

// Base axios instance
const api = axios.create({
  baseURL: "", // This will be set dynamically by the app itself
  timeout: 10000,
});

// Request interceptor with async storage support
api.interceptors.request.use(async (config) => {
  if (!api.defaults.baseURL) {
    console.error("CRITICAL: API baseURL is not set! Call setBaseUrl() from your app's entry point.");
  }
  // Fix double /api prefix if present in url
  if (config.url?.startsWith("/api/")) {
    config.url = config.url.replace("/api/", "/");
  }

  const token = await getStorage("authToken");
  const companyId = await getStorage("companyId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add Company ID header if available (Required by backend controllers)
  if (companyId) {
    config.headers["x-company-id"] = companyId;
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => res.data || {}, // Unwraps the data object from the response
  (err) => {
    console.error("API Request Failed:", err.config?.url, err.response?.data || err.message);
    return Promise.reject(err.response?.data || err);
  }
);

const setBaseUrl = (url) => {
  console.log("✅ Axios baseURL has been dynamically set to:", url);
  api.defaults.baseURL = url;
};

export { api, getStorage, setStorage, setBaseUrl };
export default api;