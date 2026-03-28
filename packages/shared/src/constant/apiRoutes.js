export const API_BASE_URL = "http://localhost:5000/api";

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_TOKEN: "/auth/verify-token",
  },
  BILLING: {
    BASE: "/billing",
    PARSE: "/billing/parse",
    GET_BY_ID: (id) => `/billing/${id}`,
  },
  INVENTORY: {
    BASE: "/inventory",
    PRODUCTS: "/inventory/products",
    STOCK_ADJUST: (id) => `/inventory/${id}/stock`,
    GET_BY_ID: (id) => `/inventory/${id}`,
  },
  PARTY: {
    BASE: "/party",
    GET_BY_ID: (id) => `/party/${id}`,
  },
  REPORTS: {
    GENERATE: "/report",
    DOWNLOAD: (id) => `/report/${id}/download`,
  },
  STAFF: {
    BASE: "/staff",
    ATTENDANCE: "/attendance",
  },
  EXPENSE: {
    BASE: "/expance",
  },
  COMPANY: {
    BASE: "/company",
    GET_BY_ID: (id) => `/company/${id}`,
  },
  SYNC: {
    PUSH: "/sync/data",
    PULL: (type) => `/sync/pull/${type}`,
    STATUS: "/sync/status",
  },
  SECURITY: {
    LOGS: "/security/logs",
  }
};