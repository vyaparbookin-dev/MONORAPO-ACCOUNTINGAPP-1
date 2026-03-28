import { api } from "./api";

export const KeyManager = {
  generateKey: async (userId) => {
    const data = await api.post("/keys/generate", { userId });
    return data;
  },

  getKeys: async () => {
    const data = await api.get("/keys/list");
    return data;
  },

  revokeKey: async (keyId) => {
    const data = await api.delete(`/keys/revoke/${keyId}`);
    return data;
  },
};