// --- RICH DEMO MOCK DATA GENERATOR FOR GUEST MODE ---
const getGuestMockData = (url, method = 'GET') => {
  const u = (url || '').toLowerCase();
  
  if (method !== 'GET') {
    return { success: true, message: "Guest Action Successful!", data: { _id: `mock_${Date.now()}` } };
  }

  // 1. Inventory / Products
  if (u.includes('inventory') || u.includes('product')) {
    const products = [
      { _id: "p1", id: "p1", name: "🍔 Crispy Veg Supreme Burger", category: "Fast Food", sellingPrice: 120, price: 120, costPrice: 60, currentStock: 45, unit: "pcs", barcode: "8901001", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200" },
      { _id: "p2", id: "p2", name: "🍕 Farmhouse Cheese Burst Pizza", category: "Pizza", sellingPrice: 280, price: 280, costPrice: 130, currentStock: 25, unit: "pcs", barcode: "8901002", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200" },
      { _id: "p3", id: "p3", name: "🍛 Shahi Paneer Butter Masala", category: "Main Course", sellingPrice: 240, price: 240, costPrice: 110, currentStock: 30, unit: "plt", barcode: "8901003", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200" },
      { _id: "p4", id: "p4", name: "🫓 Butter Garlic Tandoori Naan", category: "Main Course", sellingPrice: 45, price: 45, costPrice: 15, currentStock: 100, unit: "pcs", barcode: "8901004" },
      { _id: "p5", id: "p5", name: "🍚 Veg Dum Biryani with Raita", category: "Rice", sellingPrice: 190, price: 190, costPrice: 85, currentStock: 20, unit: "plt", barcode: "8901005" },
      { _id: "p6", id: "p6", name: "🥤 Cold Coffee with Ice Cream", category: "Beverages", sellingPrice: 95, price: 95, costPrice: 35, currentStock: 50, unit: "gls", barcode: "8901006" },
      { _id: "p7", id: "p7", name: "📱 iPhone 15 Pro 128GB (Blue)", category: "Mobile", sellingPrice: 119900, price: 119900, costPrice: 105000, currentStock: 8, unit: "pcs", barcode: "8901007", imeiList: ["354890123456781"] },
      { _id: "p8", id: "p8", name: "🔧 Century Plywood 8x4 (18mm)", category: "Hardware", sellingPrice: 2400, price: 2400, costPrice: 1850, currentStock: 60, unit: "sht", barcode: "8901008" }
    ];
    return { success: true, data: products, products: products, items: products, total: products.length, summary: { totalProducts: products.length, lowStockItems: 2, totalStockValue: 850000 } };
  }

  // 2. Billing / Invoices
  if (u.includes('billing') || u.includes('bill') || u.includes('invoice')) {
    const bills = [
      { _id: "b1", billNumber: "BILL-1001", customerName: "Ramesh Sharma", customerMobile: "9876543210", totalAmount: 580, finalAmount: 580, total: 580, paymentMode: "CASH", status: "paid", createdAt: new Date(Date.now() - 3600000).toISOString(), items: [{ name: "Crispy Veg Burger", quantity: 2, rate: 120, total: 240 }, { name: "Cold Coffee", quantity: 2, rate: 95, total: 190 }] },
      { _id: "b2", billNumber: "BILL-1002", customerName: "Suresh Gupta (उधार)", customerMobile: "9812345678", totalAmount: 1250, finalAmount: 1250, total: 1250, paymentMode: "UDHAR", status: "unpaid", createdAt: new Date(Date.now() - 7200000).toISOString(), items: [{ name: "Shahi Paneer", quantity: 2, rate: 240, total: 480 }, { name: "Butter Naan", quantity: 6, rate: 45, total: 270 }] },
      { _id: "b3", billNumber: "BILL-1003", customerName: "Anita Verma", customerMobile: "9988776655", totalAmount: 375, finalAmount: 375, total: 375, paymentMode: "UPI", status: "paid", createdAt: new Date(Date.now() - 86400000).toISOString(), items: [{ name: "Veg Dum Biryani", quantity: 1, rate: 190, total: 190 }] }
    ];
    return { success: true, data: bills, bills: bills, total: bills.length, totalSales: 2205 };
  }

  // 3. Expenses (Ghar Kharch & Business)
  if (u.includes('expense')) {
    const expenses = [
      { _id: "e1", title: "दूध व सब्जी (Daily Milk & Veg)", amount: 450, category: "Kitchen / Grocery", member: "Mummy", date: new Date().toISOString(), notes: "Fresh organic milk & veggies" },
      { _id: "e2", title: "दुकान बिजली बिल (Electricity)", amount: 2400, category: "Utilities", member: "Self", date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "Commercial meter power bill" },
      { _id: "e3", title: "किचन गैस सिलेंडर (LPG Commercial)", amount: 1850, category: "Kitchen", member: "Papa", date: new Date(Date.now() - 86400000 * 4).toISOString(), notes: "Refill Indane Gas" }
    ];
    return { success: true, data: expenses, expenses: expenses, total: expenses.length, totalExpenses: 4700 };
  }

  // 4. Parties / Customers
  if (u.includes('party') || u.includes('customer')) {
    const parties = [
      { _id: "pt1", name: "Ramesh Sharma", mobileNumber: "9876543210", phone: "9876543210", currentBalance: 0, balance: 0, address: "Shop 12, Main Market", type: "customer" },
      { _id: "pt2", name: "Suresh Gupta", mobileNumber: "9812345678", phone: "9812345678", currentBalance: 1500, balance: 1500, address: "Ward 4, Gandhi Chowk", type: "customer" },
      { _id: "pt3", name: "Pooja Traders (Supplier)", mobileNumber: "9765432109", phone: "9765432109", currentBalance: -4500, balance: -4500, address: "Industrial Area Phase 2", type: "supplier" }
    ];
    return { success: true, data: parties, parties: parties, customers: parties, total: parties.length };
  }

  // 5. Staff / Salary / Attendance
  if (u.includes('staff') || u.includes('salary') || u.includes('attendance')) {
    const staffList = [
      { _id: "st1", name: "Rohan Kumar", role: "Cashier", phone: "9871112233", salary: 15000, attendance: { presentDays: 24, halfDays: 1, absentDays: 1 } },
      { _id: "st2", name: "Sunil Chef", role: "Head Cook", phone: "9872223344", salary: 22000, attendance: { presentDays: 26, halfDays: 0, absentDays: 0 } }
    ];
    return { success: true, data: staffList, staff: staffList, list: staffList };
  }

  // 6. Approvals
  if (u.includes('approval')) {
    return { success: true, data: { bills: [], expenses: [] }, bills: [], expenses: [] };
  }

  // Default Fallback
  return { success: true, data: [], items: [], list: [] };
};

import axios from "axios";

// --- Platform-Aware Storage ---
let getStorage, setStorage; // These will be defined for the web environment.

// This file is for WEB/DESKTOP only. The React Native bundler will use `api.native.js` instead.
// We remove the React Native specific code (`require`) which was breaking the Vercel (Vite) build.
getStorage = async (key) => (typeof localStorage !== "undefined" ? localStorage.getItem(key) : null);
setStorage = async (key, value) => {
  if (typeof localStorage === "undefined") return;
  if (value === "" || value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
};

// Helper to safely get env vars across Vite, Next.js, React Native, Node
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]; // Node/Webpack/Expo
  }
  return null;
};

// Helper to determine base URL dynamically
const getBaseUrl = () => {
  // 2. Local development (npm run dev) ke liye fallback
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    return "http://localhost:5001/api";
  }
  
  // 3. Default fallback agar kuch bhi set na ho
  return getEnv("REACT_APP_API_URL") || getEnv("EXPO_PUBLIC_API_URL") || getEnv("VITE_API_URL") || "https://monorapo-accountingapp-1.onrender.com/api";
};

// Base axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000, // Increased to 120 seconds to handle large Excel imports and server cold starts
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

  console.log("[API Debug] Outgoing request:", {
    url: config.url,
    method: config.method?.toUpperCase(),
    tokenPresent: !!token,
    companyId,
    hasHeaderCompanyId: !!companyId,
  });

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

    // --- LEGACY ARRAY COMPATIBILITY HACK ---
    // If the frontend expects an array (to call .filter) but the backend now returns
    // a paginated object like { success: true, bills: [...] }, this automatically routes it.
    if (isObject && !Array.isArray(payload)) {
      const arrayKey = Object.keys(payload).find(k => Array.isArray(payload[k]));
      if (arrayKey) {
        ['filter', 'map', 'forEach', 'reduce', 'find', 'some', 'slice'].forEach(method => {
          if (typeof payload[arrayKey][method] === 'function') {
            Object.defineProperty(payload, method, {
              value: function(...args) { return payload[arrayKey][method](...args); },
              enumerable: false,
              configurable: true
            });
          }
        });
      }
    }

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
      // Check if current user is in Guest / Demo mode - do not force kick out
      const token = typeof localStorage !== 'undefined' ? (localStorage.getItem("authToken") || localStorage.getItem("token")) : null;
      const isGuestToken = token && (token.includes("demo_guest") || token.includes("guest"));
      if (isGuestToken) {
        console.warn("[API Notice] Serving rich local demo mock data for URL:", err.config?.url);
        const mockPayload = getGuestMockData(err.config?.url, err.config?.method?.toUpperCase());
        return Promise.resolve(mockPayload);
      }

      // Only redirect if we are NOT on a public page.
      if (typeof window !== 'undefined' && window.location) {
        const publicPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/key-recovery', '/landing', '/welcome', '/m', '/mobile-app'];
        
        // Fix for Electron (Desktop) which uses HashRouter
        const currentPath = window.location.protocol === 'file:' ? window.location.hash.replace('#', '').split('?')[0] : window.location.pathname;
        const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'));

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
      
      // Fix for Electron (Desktop) which uses HashRouter
      const currentPath = window.location.protocol === 'file:' ? window.location.hash.replace('#', '').split('?')[0] : window.location.pathname;
      const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'));

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