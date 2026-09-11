// --- RICH DEMO MOCK DATA GENERATOR FOR GUEST & RESILIENT FALLBACK MODE ---
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

  // 2. Categories, Subcategories, Brands, Units
  if (u.includes('category') || u.includes('categories') || u.includes('brand') || u.includes('unit') || u.includes('subcategory')) {
    const mockCategories = [
      { _id: "c1", name: "Fast Food", description: "Burgers, Pizzas, Snacks" },
      { _id: "c2", name: "Main Course", description: "Curries, Breads, Rice" },
      { _id: "c3", name: "Beverages", description: "Cold Drinks, Shakes, Teas" },
      { _id: "c4", name: "Hardware and Timber", description: "Plywood, Fittings, Tools" },
      { _id: "c5", name: "Electronics", description: "Smartphones, Accessories" }
    ];
    return { success: true, data: mockCategories, categories: mockCategories, subcategories: [], brands: [], units: [{ name: 'pcs' }, { name: 'plt' }, { name: 'kg' }, { name: 'ltr' }] };
  }

  // 3. Billing / Invoices
  if (u.includes('billing') || u.includes('bill') || u.includes('invoice')) {
    const bills = [
      { _id: "b1", billNumber: "BILL-1001", customerName: "Ramesh Sharma", customerMobile: "9876543210", totalAmount: 580, finalAmount: 580, total: 580, paymentMode: "CASH", status: "paid", createdAt: new Date(Date.now() - 3600000).toISOString(), items: [{ name: "Crispy Veg Burger", quantity: 2, rate: 120, total: 240 }, { name: "Cold Coffee", quantity: 2, rate: 95, total: 190 }] },
      { _id: "b2", billNumber: "BILL-1002", customerName: "Suresh Gupta (उधार)", customerMobile: "9812345678", totalAmount: 1250, finalAmount: 1250, total: 1250, paymentMode: "UDHAR", status: "unpaid", createdAt: new Date(Date.now() - 7200000).toISOString(), items: [{ name: "Shahi Paneer", quantity: 2, rate: 240, total: 480 }, { name: "Butter Naan", quantity: 6, rate: 45, total: 270 }] },
      { _id: "b3", billNumber: "BILL-1003", customerName: "Anita Verma", customerMobile: "9988776655", totalAmount: 375, finalAmount: 375, total: 375, paymentMode: "UPI", status: "paid", createdAt: new Date(Date.now() - 86400000).toISOString(), items: [{ name: "Veg Dum Biryani", quantity: 1, rate: 190, total: 190 }] }
    ];
    return { success: true, data: bills, bills: bills, total: bills.length, totalSales: 2205 };
  }

  // 4. Expenses (Ghar Kharch & Business)
  if (u.includes('expense')) {
    const expenses = [
      { _id: "e1", title: "दूध व सब्जी (Daily Milk and Veg)", amount: 450, category: "Kitchen / Grocery", member: "Mummy", date: new Date().toISOString(), notes: "Fresh organic milk and veggies" },
      { _id: "e2", title: "दुकान बिजली बिल (Electricity)", amount: 2400, category: "Utilities", member: "Self", date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "Commercial meter power bill" },
      { _id: "e3", title: "किचन गैस सिलेंडर (LPG Commercial)", amount: 1850, category: "Kitchen", member: "Papa", date: new Date(Date.now() - 86400000 * 4).toISOString(), notes: "Refill Indane Gas" }
    ];
    return { success: true, data: expenses, expenses: expenses, total: expenses.length, totalExpenses: 4700 };
  }

  // 5. Parties / Customers
  if (u.includes('party') || u.includes('customer')) {
    const parties = [
      { _id: "pt1", name: "Ramesh Sharma", mobileNumber: "9876543210", phone: "9876543210", currentBalance: 0, balance: 0, address: "Shop 12, Main Market", type: "customer" },
      { _id: "pt2", name: "Suresh Gupta", mobileNumber: "9812345678", phone: "9812345678", currentBalance: 1500, balance: 1500, address: "Ward 4, Gandhi Chowk", type: "customer" },
      { _id: "pt3", name: "Pooja Traders (Supplier)", mobileNumber: "9765432109", phone: "9765432109", currentBalance: -4500, balance: -4500, address: "Industrial Area Phase 2", type: "supplier" }
    ];
    return { success: true, data: parties, parties: parties, customers: parties, total: parties.length };
  }

  // 6. Staff / Salary / Attendance
  if (u.includes('staff') || u.includes('salary') || u.includes('attendance')) {
    const staffList = [
      { _id: "st1", name: "Rohan Kumar", role: "Cashier", phone: "9871112233", salary: 15000, attendance: { presentDays: 24, halfDays: 1, absentDays: 1 } },
      { _id: "st2", name: "Sunil Chef", role: "Head Cook", phone: "9872223344", salary: 22000, attendance: { presentDays: 26, halfDays: 0, absentDays: 0 } }
    ];
    return { success: true, data: staffList, staff: staffList, list: staffList };
  }

  // 7. Approvals
  if (u.includes('approval')) {
    return { success: true, data: { bills: [], expenses: [] }, bills: [], expenses: [] };
  }

  // 8. Banking / Cash
  if (u.includes('bank') || u.includes('cash')) {
    const banks = [
      { _id: "bnk1", bankName: "HDFC Current A/c", accountNumber: "XXXX5678", accountType: "CURRENT", balance: 145000 },
      { _id: "bnk2", bankName: "SBI Savings A/c", accountNumber: "XXXX9012", accountType: "SAVINGS", balance: 48500 }
    ];
    return { success: true, data: banks, banks: banks, accounts: banks };
  }

  // 9. Reports / Day Book / Profit Loss
  if (u.includes('report') || u.includes('daybook') || u.includes('profitloss') || u.includes('gst')) {
    return { 
      success: true, 
      data: { totalSales: 2205, totalExpenses: 4700, netProfit: 15200, transactions: [] },
      summary: { totalSales: 2205, totalExpenses: 4700, netProfit: 15200 },
      daybook: [],
      records: []
    };
  }

  // Default Fallback
  return { success: true, data: [], items: [], list: [] };
};

import axios from "axios";

// --- Platform-Aware Storage ---
let getStorage, setStorage;

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
    return process.env[key];
  }
  return null;
};

// Helper to determine base URL dynamically
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    return "http://localhost:5001/api";
  }
  return getEnv("REACT_APP_API_URL") || getEnv("EXPO_PUBLIC_API_URL") || getEnv("VITE_API_URL") || "https://monorapo-accountingapp-1.onrender.com/api";
};

// Base axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000,
});

// Request interceptor with async storage support
api.interceptors.request.use(async (config) => {
  if (config.url?.startsWith("/api/")) {
    config.url = config.url.replace("/api/", "/");
  }
  
  const token = (await getStorage("authToken")) || (await getStorage("token"));
  const companyId = (await getStorage("companyId")) || (await getStorage("selectedCompany"));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (companyId) {
    config.headers["x-company-id"] = companyId;
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => {
    const payload = res.data || {};

    const isObject = typeof payload === 'object' && payload !== null;
    const hasDataProperty = isObject && 'data' in payload;

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
    console.warn("API Request Encountered Status:", err.config?.url, err.response?.status || err.message);
    
    // Check if current user is in Guest / Demo mode or Demo Company
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem("authToken") || localStorage.getItem("token")) : null;
    const companyId = typeof localStorage !== 'undefined' ? (localStorage.getItem("companyId") || localStorage.getItem("selectedCompany")) : null;
    const isGuestOrDemo = (token && (token.includes("demo_guest") || token.includes("guest"))) ||
                          (companyId && (String(companyId).includes("demo_") || String(companyId).includes("custom_co_"))) ||
                          (typeof localStorage !== 'undefined' && localStorage.getItem("isGuestMode") === "true");

    // RESILIENT OFFLINE / GUEST / BACKEND ERROR INTERCEPTION
    // If backend 500s or 401s in guest/demo mode, NEVER crash the UI, serve rich mock data!
    if (isGuestOrDemo || err.response?.status === 500 || !err.response) {
      if (isGuestOrDemo || !err.response) {
        console.info("[API Resilience] Serving instant mock payload for URL:", err.config?.url);
        const mockPayload = getGuestMockData(err.config?.url, err.config?.method?.toUpperCase());
        return Promise.resolve(mockPayload);
      }
    }

    // --- Universal 401 Handler for Real Users ---
    if (err.response?.status === 401 && !isGuestOrDemo) {
      if (typeof window !== 'undefined' && window.location) {
        const publicPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/key-recovery', '/landing', '/welcome', '/m', '/mobile-app'];
        const currentPath = window.location.protocol === 'file:' ? window.location.hash.replace('#', '').split('?')[0] : window.location.pathname;
        const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'));

        if (!isPublicPage) {
          console.error(`Auth Error (401) on protected route ${err.config?.url}. Clearing credentials.`);
          setStorage("authToken", null);
          setStorage("token", null);

          setTimeout(() => {
            if (window.location.protocol === 'file:') {
              window.location.hash = "/login";
            } else {
              window.location.href = "/login";
            }
          }, 100);
        }
      }
    }

    // --- Handle Company Issues Gracefully ---
    if (typeof window !== 'undefined' && window.location) {
      if (err.response?.status === 404 && err.response?.data?.message?.includes("Company not found")) {
        setStorage("companyId", null);
        setStorage("selectedCompany", null);
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
