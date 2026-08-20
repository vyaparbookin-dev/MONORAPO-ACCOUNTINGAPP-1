import { api } from "@repo/shared";

export const auth = {
  login: (data) => api.post("/api/auth/login", data),
  register: (data) => api.post("/api/auth/register", data),
};

export const billing = {
  create: (data) => api.post("/api/billing", data),
  list: (params) => api.get("/api/billing", { params }),
  getById: (id) => api.get(`/api/billing/${id}`),
  update: (id, data) => api.put(`/api/billing/${id}`, data),
  delete: (id) => api.delete(`/api/billing/${id}`),
  parseImage: (data) => api.post("/api/billing/parse", data),
};

export const inventory = {
  list: () => api.get("/api/inventory"),
  add: (data) => api.post("/api/inventory", data),
  getById: (id) => api.get(`/api/inventory/${id}`),
  update: (id, data) => api.put(`/api/inventory/${id}`, data),
  delete: (id) => api.delete(`/api/inventory/${id}`),
  updateStock: (id, quantity) => api.put(`/api/inventory/${id}/stock`, { quantity }),
};

export const party = {
  create: (data) => api.post("/api/party", data),
  list: (type) => api.get("/api/party", { params: { type } }),
  getById: (id) => api.get(`/api/party/${id}`),
  update: (id, data) => api.put(`/api/party/${id}`, data),
  delete: (id) => api.delete(`/api/party/${id}`),
};

export const reports = {
  generate: (type, filter) => api.post("/api/reports/generate", { type, filter }),
  download: (id) => api.get(`/api/reports/download/${id}`, { responseType: "blob" }),
};

export const staff = {
  create: (data) => api.post("/api/staff", data),
  list: (type) => api.get("/api/staff"),
  getById: (id) => api.get(`/api/staff/${id}`),
  update: (id, data) => api.put(`/api/staff/${id}`, data),
  delete: (id) => api.delete(`/api/staff/${id}`),
};

export const attendance = {
  mark: (data) => api.post("/api/attendance", data),
  get: (params) => api.get("/api/attendance", { params }),
  monthlyReport: (month, year) => api.get(`/api/attendance/report`, { params: { month, year } }),
};

export const expenses = {
  add: (data) => api.post("/api/expenses", data),
  list: (type) => api.get("/api/expenses"),
};

export const company = {
  add: (data) => api.post("/api/company", data),
  list: () => api.get("/api/company"),
  getById: (id) => api.get(`/api/company/${id}`),
};

export const sync = {
  push: (data) => api.post("/api/sync/push", data),
  pull: (dataType) => api.get(`/api/sync/pull/${dataType}`),
  status: () => api.get("/api/sync/status"),
};

// Attach services to api instance for convenience
api.auth = auth;
api.billing = billing;
api.inventory = inventory;
api.party = party;
api.reports = reports;
api.staff = staff;
api.attendance = attendance;
api.expenses = expenses;
api.company = company;
api.sync = sync;

export default api;
