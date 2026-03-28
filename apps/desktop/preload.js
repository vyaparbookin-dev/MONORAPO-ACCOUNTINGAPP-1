const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Database Methods (React इन्ही को कॉल करेगा)
  db: {
    getCustomers: () => ipcRenderer.invoke('db:get-customers'),
    addCustomer: (customer) => ipcRenderer.invoke('db:add-customer', customer),
    getInvoices: () => ipcRenderer.invoke('db:get-invoices'),
    saveInvoice: (data) => ipcRenderer.invoke('db:save-invoice', data),
    updateInvoice: (uuid, data) => ipcRenderer.invoke('db:update-invoice', uuid, data),
    deleteInvoice: (uuid) => ipcRenderer.invoke('db:delete-invoice', uuid),
    getInventory: () => ipcRenderer.invoke('db:get-inventory'),
    saveProduct: (product) => ipcRenderer.invoke('db:save-product', product),
    updateProduct: (uuid, product) => ipcRenderer.invoke('db:update-product', uuid, product),
    deleteProduct: (uuid) => ipcRenderer.invoke('db:delete-product', uuid),
    getAdjustments: () => ipcRenderer.invoke('db:get-adjustments'),
    saveAdjustment: (adj) => ipcRenderer.invoke('db:save-adjustment', adj),
    getCompanies: () => ipcRenderer.invoke('db:get-companies'),
    saveCompany: (company) => ipcRenderer.invoke('db:save-company', company),
    getApprovals: () => ipcRenderer.invoke('db:get-approvals'),

    // Settings Master Data Methods
    deleteCustomer: (uuid) => ipcRenderer.invoke('db:delete-customer', uuid),
    getUnits: () => ipcRenderer.invoke('db:get-units'),
    saveUnit: (data) => ipcRenderer.invoke('db:save-unit', data),
    deleteUnit: (uuid) => ipcRenderer.invoke('db:delete-unit', uuid),
    getCategories: () => ipcRenderer.invoke('db:get-categories'),
    saveCategory: (data) => ipcRenderer.invoke('db:save-category', data),
    deleteCategory: (uuid) => ipcRenderer.invoke('db:delete-category', uuid),

    // Staff & Salary Methods
    getStaff: () => ipcRenderer.invoke('db:get-staff'),
    getSalaries: () => ipcRenderer.invoke('db:get-salaries'),
    saveSalary: (data) => ipcRenderer.invoke('db:save-salary', data),
    updateSalary: (uuid, data) => ipcRenderer.invoke('db:update-salary', uuid, data),
    deleteSalary: (uuid) => ipcRenderer.invoke('db:delete-salary', uuid),
    getTransactions: (staffId) => ipcRenderer.invoke('db:get-transactions', staffId),
    saveTransaction: (data) => ipcRenderer.invoke('db:save-transaction', data),

    // Expenses & Sync Queue Methods
    getExpenses: () => ipcRenderer.invoke('db:get-expenses'),
    saveExpense: (data) => ipcRenderer.invoke('db:save-expense', data),
    updateExpense: (uuid, data) => ipcRenderer.invoke('db:update-expense', uuid, data),
    deleteExpense: (uuid) => ipcRenderer.invoke('db:delete-expense', uuid),
    getSyncQueue: () => ipcRenderer.invoke('db:get-sync-queue'),
    saveSyncQueue: (queue) => ipcRenderer.invoke('db:save-sync-queue', queue),
    saveAuditLog: (log) => ipcRenderer.invoke('db:save-audit-log', log),
  },
  // General IPC
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});