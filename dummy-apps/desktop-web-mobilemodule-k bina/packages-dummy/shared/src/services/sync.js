import { api } from "./api";
import { API_ROUTES } from "../constant/apiRoutes";

export const SyncService = {
  syncData: async (data) => {
    const response = await api.post(API_ROUTES.SYNC.PUSH, data);
    return response;
  },

  pullData: async (dataType) => {
    const response = await api.get(API_ROUTES.SYNC.PULL(dataType));
    return response;
  },

  getSyncStatus: async () => {
    const response = await api.get(API_ROUTES.SYNC.STATUS);
    return response;
  }
};