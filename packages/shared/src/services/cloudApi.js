import axios from "axios";

// Helper to safely get env vars across Vite, Next.js, React Native, Node
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]; // Node/Webpack/Expo
  }
  return null;
};

// Cloud API for user optional Google/Cloud storage
const cloudApi = axios.create({
  baseURL: getEnv("REACT_APP_CLOUD_API") || getEnv("VITE_CLOUD_API") || "https://cloud.example.com/api",
  timeout: 15000,
});

cloudApi.interceptors.request.use(config => {
  const token = localStorage.getItem("cloudToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

cloudApi.interceptors.response.use(
  response => response,
  error => Promise.reject(error.response || error.message)
);

/**
 * Upload user data to cloud
 * @param {Object} data
 * @returns
 */
export const uploadToCloud = async (data) => {
  try {
    const res = await cloudApi.post("/upload", { data });
    return res.data;
  } catch (err) {
    console.error("Cloud upload failed", err);
    return { status: "error", error: err };
  }
};

/**
 * Fetch user data from cloud
 * @param {string} userId
 * @returns
 */
export const fetchFromCloud = async (userId) => {
  try {
    const res = await cloudApi.get(`/fetch/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Cloud fetch failed", err);
    return { status: "error", error: err };
  }
};

export default cloudApi;