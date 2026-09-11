// --- RICH DEMO MOCK DATA GENERATOR FOR GUEST & RESILIENT FALLBACK MODE ---
const getGuestMockData = (url, method = 'GET') => {
  const u = (url || '').toLowerCase();
  
  if (method !== 'GET') {
    return { success: true, message: "Guest Action Successful!", data: { _id: `mock_${Date.now()}` } };
  }

  // 1. Inventory / Products (Restaurant Menu & Raw Materials)
  if (u.includes('inventory') || u.includes('product')) {
    const products = [
      { _id: "p1", id: "p1", name: "🍛 Shahi Paneer Butter Masala", category: "Main Course", sellingPrice: 240, price: 240, costPrice: 110, currentStock: 40, unit: "plt", barcode: "8901001", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200", recipe: [{ item: "Fresh Dairy Paneer", qty: "200g" }, { item: "Amul Salted Butter", qty: "30g" }] },
      { _id: "p2", id: "p2", name: "🫓 Butter Garlic Tandoori Naan", category: "Main Course", sellingPrice: 45, price: 45, costPrice: 15, currentStock: 150, unit: "pcs", barcode: "8901002", recipe: [{ item: "Maida Flour", qty: "100g" }, { item: "Amul Salted Butter", qty: "15g" }] },
      { _id: "p3", id: "p3", name: "🍚 Veg Dum Biryani with Raita", category: "Rice", sellingPrice: 190, price: 190, costPrice: 85, currentStock: 35, unit: "plt", barcode: "8901003", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200", recipe: [{ item: "Basmati Rice", qty: "250g" }, { item: "Veggies", qty: "80g" }] },
      { _id: "p4", id: "p4", name: "🥤 Cold Coffee with Ice Cream", category: "Beverages", sellingPrice: 95, price: 95, costPrice: 35, currentStock: 60, unit: "gls", barcode: "8901004", recipe: [{ item: "Milk", qty: "200ml" }, { item: "Coffee & Ice Cream", qty: "1 scoop" }] },
      { _id: "p5", id: "p5", name: "🍔 Crispy Veg Supreme Burger", category: "Fast Food", sellingPrice: 120, price: 120, costPrice: 60, currentStock: 50, unit: "pcs", barcode: "8901005", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200", recipe: [{ item: "Burger Bun Pack", qty: "1 pc" }, { item: "Cheese Slice", qty: "1 pc" }] },
      { _id: "p6", id: "p6", name: "🍕 Farmhouse Cheese Burst Pizza", category: "Pizza", sellingPrice: 280, price: 280, costPrice: 130, currentStock: 30, unit: "pcs", barcode: "8901006", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200", recipe: [{ item: "Pizza Base", qty: "1 pc" }, { item: "Mozzarella Cheese", qty: "80g" }] },
      { _id: "p7", id: "p7", name: "🥛 Fresh Dairy Paneer (कच्चा माल)", category: "Raw Material", sellingPrice: 340, price: 340, costPrice: 280, currentStock: 20, unit: "kg", barcode: "RAW001" },
      { _id: "p8", id: "p8", name: "🧈 Amul Salted Butter (कच्चा माल)", category: "Raw Material", sellingPrice: 540, price: 540, costPrice: 480, currentStock: 15, unit: "kg", barcode: "RAW002" },
      { _id: "p9", id: "p9", name: "🍞 Burger Bun Pack (कच्चा माल)", category: "Raw Material", sellingPrice: 45, price: 45, costPrice: 30, currentStock: 100, unit: "pcs", barcode: "RAW003" }
    ];
    return { success: true, data: products, products: products, items: products, total: products.length, summary: { totalProducts: products.length, lowStockItems: 1, totalStockValue: 38500 } };
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
      {
        _id: "b_real_1001",
        billNumber: "BILL-REST-1001",
        customerName: "Rahul Verma",
        customerMobile: "7828289433",
        customerAddress: "Shop 4, Civil Lines",
        table: "Table 3 (AC Hall)",
        waiter: "Rohan",
        totalAmount: 800,
        finalAmount: 800,
        total: 800,
        paymentMode: "UPI (Paid)",
        status: "paid",
        createdAt: new Date().toISOString(),
        items: [
          { name: "Shahi Paneer Butter Masala", quantity: 1, rate: 240, total: 240, unit: "plt" },
          { name: "Butter Garlic Tandoori Naan", quantity: 4, rate: 45, total: 180, unit: "pcs" },
          { name: "Veg Dum Biryani with Raita", quantity: 1, rate: 190, total: 190, unit: "plt" },
          { name: "Cold Coffee with Ice Cream", quantity: 2, rate: 95, total: 190, unit: "gls" }
        ]
      }
    ];
    return { success: true, data: bills, bills: bills, total: bills.length, totalSales: 800 };
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
      { _id: "pt_rahul", name: "Rahul Verma", mobileNumber: "7828289433", phone: "7828289433", currentBalance: 0, balance: 0, address: "Shop 4, Civil Lines", type: "customer" },
      { _id: "pt_amul", name: "Amul Dairy Distributor (Supplier)", mobileNumber: "9425574230", phone: "9425574230", currentBalance: -2500, balance: -2500, address: "Dairy Plant Road", type: "supplier" }
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
