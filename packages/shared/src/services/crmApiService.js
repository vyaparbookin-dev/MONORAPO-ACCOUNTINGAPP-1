import { api } from "./api";

export const crmApiService = {
  // --- Leads API ---
  getLeads: (params) => {
    return api.get("/leads", { params });
  },
  getLeadById: (id) => {
    return api.get(`/leads/${id}`);
  },
  createLead: (leadData) => {
    return api.post("/leads", leadData);
  },
  updateLead: (id, leadData) => {
    return api.put(`/leads/${id}`, leadData);
  },
  deleteLead: (id) => {
    return api.delete(`/leads/${id}`);
  },

  // --- Quotations API ---
  getQuotations: (params) => {
    return api.get("/quotations", { params });
  },
  getQuotationById: (id) => {
    return api.get(`/quotations/${id}`);
  },
  createQuotation: (quotationData) => {
    return api.post("/quotations", quotationData);
  },
  updateQuotation: (id, quotationData) => {
    return api.put(`/quotations/${id}`, quotationData);
  },
  deleteQuotation: (id) => {
    return api.delete(`/quotations/${id}`);
  },
  
  // --- Convert Lead to Customer ---
  convertLeadToCustomer: (leadId) => {
    return api.post(`/leads/${leadId}/convert`);
  }
};