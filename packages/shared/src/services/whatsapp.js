import { api } from "./api";

export const WhatsappService = {
  sendMessage: async (phoneNumber, message, type = "text") => {
    const response = await api.post("/whatsapp/send", { phoneNumber, message, type });
    return response;
  },

  sendInvoice: async (phoneNumber, invoiceId) => {
    const response = await api.post(`/whatsapp/send-invoice/${invoiceId}`, { phoneNumber });
    return response;
  },

  sendBulk: async (contacts, message) => {
    const response = await api.post("/whatsapp/bulk", { contacts, message });
    return response;
  },

  getHistory: async () => {
    const response = await api.get("/whatsapp/history");
    return response;
  }
};

export const sendBulk = async (contacts, message) => {
  const response = await api.post("/whatsapp/bulk", { contacts, message });
  return response;
};

export const getHistory = async () => {
  const response = await api.get("/whatsapp/history");
  return response;
};