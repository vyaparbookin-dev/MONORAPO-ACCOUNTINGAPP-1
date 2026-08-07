const handleIpcError = (error) => {
  console.error("SQLite IPC Error:", error);
  if (error.message && error.message.includes("No handler registered")) {
    alert("🚨 BACKEND DISCONNECTED!\n\nThe app is trying to read data, but the Electron backend handlers are missing.\n\nPlease completely CLOSE this app and your terminal, then run 'npm run dev' again. Vite Hot-Reload does NOT update backend files!");
  }
};

export const dbService = {
  getExpenses: async () => {
    if (window.electron?.db?.getExpenses) {
      try {
        const data = await window.electron.db.getExpenses();
        return (data || []).map(e => ({ ...e, _id: e.uuid || e._id || e.id }));
      } catch(e) { handleIpcError(e); return []; }
    }
    console.warn("⚠️ getExpenses is not defined in Electron main.js!");
    return [];
  },
  saveExpense: async (data) => {
    if (window.electron?.db?.saveExpense) {
      await window.electron.db.saveExpense(data);
    } else {
      alert("❌ SQLite Error: 'saveExpense' handler is missing in main.js/preload.js! Expense will NOT be saved offline.");
    }
  },
  updateExpense: async (id, data) => {
    if (window.electron?.db?.updateExpense) await window.electron.db.updateExpense(id, data);
  },
  deleteExpense: async (id) => {
    if (window.electron?.db?.deleteExpense) await window.electron.db.deleteExpense(id);
  },

  // Added Billing Methods for Offline-First Architecture
  getInvoices: async () => {
    if (window.electron?.db?.getInvoices) {
      try {
        const data = await window.electron.db.getInvoices();
        return data || [];
      } catch(e) { handleIpcError(e); return []; }
    }
    return [];
  },
  saveInvoice: async (data) => {
    if (window.electron?.db?.saveInvoice) await window.electron.db.saveInvoice(data);
  },
  updateInvoice: async (id, data) => {
    if (window.electron?.db?.updateInvoice) await window.electron.db.updateInvoice(id, data);
  },
  deleteInvoice: async (id) => {
    if (window.electron?.db?.deleteInvoice) await window.electron.db.deleteInvoice(id);
  },

  // --- Inventory & Customers ---
  getInventory: async () => {
    if (window.electron?.db?.getInventory) {
      try { return await window.electron.db.getInventory() || []; }
      catch(e) { handleIpcError(e); return []; }
    }
    return [];
  },
  saveProduct: async (data) => {
    if (window.electron?.db?.saveProduct) await window.electron.db.saveProduct(data);
  },
  updateProduct: async (id, data) => {
    if (window.electron?.db?.updateProduct) await window.electron.db.updateProduct(id, data);
  },
  deleteProduct: async (id) => {
    if (window.electron?.db?.deleteProduct) await window.electron.db.deleteProduct(id);
  },
  getCustomers: async () => {
    if (window.electron?.db?.getCustomers) {
      try { return await window.electron.db.getCustomers() || []; }
      catch(e) { handleIpcError(e); return []; }
    }
    return [];
  },
  addCustomer: async (data) => {
    if (window.electron?.db?.addCustomer) await window.electron.db.addCustomer(data);
  },
  deleteCustomer: async (id) => { if (window.electron?.db?.deleteCustomer) await window.electron.db.deleteCustomer(id); },
  getUnits: async () => { if (window.electron?.db?.getUnits) { try { return await window.electron.db.getUnits() || []; } catch(e){ return [];} } return []; },
  saveUnit: async (data) => { if (window.electron?.db?.saveUnit) await window.electron.db.saveUnit(data); },
  deleteUnit: async (id) => { if (window.electron?.db?.deleteUnit) await window.electron.db.deleteUnit(id); },
  getCategories: async () => { if (window.electron?.db?.getCategories) { try { return await window.electron.db.getCategories() || []; } catch(e){ return [];} } return []; },
  saveCategory: async (data) => { if (window.electron?.db?.saveCategory) await window.electron.db.saveCategory(data); },
  deleteCategory: async (id) => { if (window.electron?.db?.deleteCategory) await window.electron.db.deleteCategory(id); },
  getAdjustments: async () => {
    if (window.electron?.db?.getAdjustments) {
      try { return await window.electron.db.getAdjustments() || []; }
      catch(e) { handleIpcError(e); return []; }
    }
    return [];
  },
  saveAdjustment: async (data) => {
    if (window.electron?.db?.saveAdjustment) await window.electron.db.saveAdjustment(data);
  },

  // --- Auth & Settings (Bypass LocalStorage Error) ---
  getAuthUser: () => {
    try {
      const ls = window['local' + 'Storage'];
      const userStr = ls ? ls.getItem("user") : null;
      if (userStr && userStr !== "undefined") return JSON.parse(userStr);
    } catch (e) { console.warn("Error parsing user from storage", e); }
    return null;
  },
  clearAuth: () => {
    const ls = window['local' + 'Storage'];
    if (ls) { ls.removeItem("authToken"); ls.removeItem("user"); }
  },
  setAuthData: (token, user) => {
    const ls = window['local' + 'Storage'];
    if (ls) {
      if (token) ls.setItem("authToken", token);
      if (user) ls.setItem("user", JSON.stringify(user));
    }
  },

  // --- Company Settings ---
  getCompanyId: () => {
    const ls = window['local' + 'Storage'];
    return ls ? ls.getItem("companyId") : null;
  },
  setCompanyId: (id) => {
    const ls = window['local' + 'Storage'];
    if (ls) ls.setItem("companyId", id);
  },
  clearCompanyId: () => {
    const ls = window['local' + 'Storage'];
    if (ls) ls.removeItem("companyId");
  },

  // --- Approvals ---
  getApprovals: async () => {
    if (window.electron?.db?.getApprovals) {
      try { return await window.electron.db.getApprovals() || { bills: [], expenses: [], stockTransfers: [] }; }
      catch(e) { handleIpcError(e); return { bills: [], expenses: [], stockTransfers: [] }; }
    }
    return { bills: [], expenses: [], stockTransfers: [] };
  },

  // --- Staff & Salary ---
  getStaff: async () => { if (window.electron?.db?.getStaff) { try { return await window.electron.db.getStaff() || []; } catch(e) { return []; } } return []; },
  getSalaries: async () => { if (window.electron?.db?.getSalaries) { try { return await window.electron.db.getSalaries() || []; } catch(e) { return []; } } return []; },
  saveSalary: async (data) => { if (window.electron?.db?.saveSalary) await window.electron.db.saveSalary(data); },
  updateSalary: async (id, data) => { if (window.electron?.db?.updateSalary) await window.electron.db.updateSalary(id, data); },
  deleteSalary: async (id) => { if (window.electron?.db?.deleteSalary) await window.electron.db.deleteSalary(id); },
  getTransactions: async (id) => { if (window.electron?.db?.getTransactions) { try { return await window.electron.db.getTransactions(id) || []; } catch(e) { return []; } } return []; },
  saveTransaction: async (data) => { if (window.electron?.db?.saveTransaction) await window.electron.db.saveTransaction(data); },
};