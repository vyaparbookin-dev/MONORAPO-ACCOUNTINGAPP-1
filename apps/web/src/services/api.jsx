import { api, API_ROUTES } from "@repo/shared";

export const auth = {
  login: (data) => api.post(API_ROUTES.AUTH.LOGIN, data),
  register: (data) => api.post(API_ROUTES.AUTH.REGISTER, data),
};

export const billing = {
  create: (data) => api.post(API_ROUTES.BILLING.BASE, data),
  list: (params) => api.get(API_ROUTES.BILLING.BASE, { params }),
  getById: (id) => api.get(API_ROUTES.BILLING.GET_BY_ID(id)),
  update: (id, data) => api.put(API_ROUTES.BILLING.GET_BY_ID(id), data),
  delete: (id) => api.delete(API_ROUTES.BILLING.GET_BY_ID(id)),
  parseImage: (data) => api.post(API_ROUTES.BILLING.PARSE, data),
};

export const inventory = {
  list: () => api.get(API_ROUTES.INVENTORY.BASE),
  add: (data) => api.post(API_ROUTES.INVENTORY.BASE, data),
  getById: (id) => api.get(API_ROUTES.INVENTORY.GET_BY_ID(id)),
  update: (id, data) => api.put(API_ROUTES.INVENTORY.GET_BY_ID(id), data),
  delete: (id) => api.delete(API_ROUTES.INVENTORY.GET_BY_ID(id)),
  updateStock: (id, quantity) => api.put(API_ROUTES.INVENTORY.STOCK_ADJUST(id), { quantity }),
};

export const party = {
  create: (data) => api.post(API_ROUTES.PARTY.BASE, data),
  list: (type) => api.get(API_ROUTES.PARTY.BASE, { params: { type } }),
  getById: (id) => api.get(API_ROUTES.PARTY.GET_BY_ID(id)),
  update: (id, data) => api.put(API_ROUTES.PARTY.GET_BY_ID(id), data),
  delete: (id) => api.delete(API_ROUTES.PARTY.GET_BY_ID(id)),
};

export const reports = {
  generate: (type, filter) => api.post(API_ROUTES.REPORTS.GENERATE, { type, filter }),
  download: (id) => api.get(API_ROUTES.REPORTS.DOWNLOAD(id), { responseType: "blob" }),
};

export const staff = {
  create: (data) => api.post(API_ROUTES.STAFF.BASE, data),
  list: (type) => api.get(API_ROUTES.STAFF.BASE),
  getById: (id) => api.get(`${API_ROUTES.STAFF.BASE}/${id}`),
  update: (id, data) => api.put(`${API_ROUTES.STAFF.BASE}/${id}`, data),
  delete: (id) => api.delete(`${API_ROUTES.STAFF.BASE}/${id}`),
};

export const attendance = {
  mark: (data) => api.post(API_ROUTES.STAFF.ATTENDANCE, data),
  get: (params) => api.get(API_ROUTES.STAFF.ATTENDANCE, { params }),
  monthlyReport: (month, year) => api.get(`${API_ROUTES.STAFF.ATTENDANCE}/report`, { params: { month, year } }),
};

export const expenses = {
  add: (data) => api.post(API_ROUTES.EXPENSE.BASE, data),
  list: (type) => api.get(API_ROUTES.EXPENSE.BASE),
};

export const company = {
  add: (data) => api.post(API_ROUTES.COMPANY.BASE, data),
  list: () => api.get(API_ROUTES.COMPANY.BASE),
  getById: (id) => api.get(API_ROUTES.COMPANY.GET_BY_ID(id)),
};

export const sync = {
  push: (data) => api.post(API_ROUTES.SYNC.PUSH, data),
  pull: (dataType) => api.get(API_ROUTES.SYNC.PULL(dataType)),
  status: () => api.get(API_ROUTES.SYNC.STATUS),
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
