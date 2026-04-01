import axios from "axios";

// --- Platform-Aware Storage ---
let getStorage, setStorage;

// A common way to check for React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

if (isReactNative) {
  // Use AsyncStorage for React Native
  // FIX: Typo in package name and using a variable to prevent Vite's static analysis error.
  // Vite build ke time par isko resolve karne ki koshish nahi karega.
  const asyncStoragePackageName = '@react-native-async-storage/async-storage';
  const AsyncStorage = require(asyncStoragePackageName).default;
  getStorage = async (key) => AsyncStorage.getItem(key);
  setStorage = async (key, value) => {
    if (value === "" || value === null || value === undefined) {
      return AsyncStorage.removeItem(key);
    }
    return AsyncStorage.setItem(key, String(value));
  };
} else {
  // Use localStorage for Web/Desktop
  getStorage = async (key) => (typeof localStorage !== "undefined" ? localStorage.getItem(key) : null);
  setStorage = async (key, value) => {
    if (typeof localStorage === "undefined") return;
    if (value === "" || value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  };
}

// Helper to safely get env vars across Vite, Next.js, React Native, Node
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]; // Node/Webpack/Expo
  }
  return null;
};

// Helper to determine base URL dynamically
const getBaseUrl = () => {
  // 1. Vercel/Netlify/Render pe deployment ke liye sabse important
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }

  // 2. Local development (npm run dev) ke liye fallback
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    return "http://localhost:5001/api";
  }
  
  // 3. Default fallback agar kuch bhi set na ho
  return getEnv("REACT_APP_API_URL") || getEnv("EXPO_PUBLIC_API_URL") || getEnv("VITE_API_URL") || "http://localhost:5001/api";
};

// Base axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // Increased to 30 seconds to handle server cold starts on free tiers
});

// Request interceptor with async storage support
api.interceptors.request.use(async (config) => {
  // Fix double /api prefix if present in url
  if (config.url?.startsWith("/api/")) {
    config.url = config.url.replace("/api/", "/");
  }
  
  // Debug: Check exact URL being requested
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

  // Fallback checks: in case login saves token as "token" instead of "authToken"
  const token = (await getStorage("authToken")) || (await getStorage("token"));
  const companyId = (await getStorage("companyId")) || (await getStorage("selectedCompany"));

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
  (res) => {
    const payload = res.data || {};

    // This is a compatibility layer to support a gradual frontend refactor.
    // Some backend endpoints return data directly (e.g., { items: [...] }).
    // Some frontend components expect to access data via `response.items`.
    // Other, older components might still expect `response.data.items`.
    // This logic ensures both patterns work by attaching the payload to itself
    // under a non-enumerable `data` property if that property doesn't already exist.
    const isObject = typeof payload === 'object' && payload !== null;
    const hasDataProperty = isObject && 'data' in payload;

    if (isObject && !hasDataProperty) {
      Object.defineProperty(payload, 'data', { value: payload, enumerable: false, configurable: true });
    }
    return payload;
  },
  (err) => {
    // Log detailed error for debugging
    console.error("API Request Failed:", err.config?.url, err.response?.data || err.message);
    
    // --- Universal 401 Handler ---
    // If token is invalid, log out on all platforms.
    if (err.response?.status === 401) {
      // Only redirect if we are NOT on a public page.
      if (typeof window !== 'undefined' && window.location) {
        const publicPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/key-recovery'];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPaths.includes(currentPath);

        if (!isPublicPage) {
          console.error(`Auth Error (401) on protected route ${err.config.url}. Clearing credentials and redirecting to login.`);
          setStorage("authToken", null); // Clear token
          setStorage("token", null); // Clear fallback token

          // Use a small delay to allow storage to clear before redirecting
          setTimeout(() => {
            // For web/desktop, we can force a redirect.
              if (window.location.protocol === 'file:') {
                window.location.hash = "/login"; // Electron (Desktop) uses HashRouter
              } else {
                window.location.href = "/login"; // Web uses BrowserRouter
              }
          }, 100);
        }
      }
    }

    // --- Web/Desktop Specific Error Handlers ---
    if (typeof window !== 'undefined' && window.location) {
      const publicPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/key-recovery'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.includes(currentPath);

      // Handle "Company not found" (e.g. if company was deleted but ID is still in storage)
      if (err.response?.status === 404 && (err.response?.data?.message?.includes("Company not found"))) {
        setStorage("companyId", null); // Clear invalid company ID
        setStorage("selectedCompany", null);
        if (!isPublicPage && !window.location.pathname.includes("/company/list") && !window.location.hash.includes("/company/list")) {
          alert("The selected company no longer exists. Please select another company.");
        }
      }

      // Handle missing company ID header
      if (err.response?.status === 400 && (err.response?.data?.message?.includes("Company ID is missing"))) {
        if (!isPublicPage && !window.location.pathname.includes("/company/list") && !window.location.hash.includes("/company/list")) {
          alert("Please select a company to continue.");
        }
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

const setBaseUrl = (url) => {
  api.defaults.baseURL = url;
};

export { api, getStorage, setStorage, setBaseUrl };
export default api;