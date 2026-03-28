import { getData, postData } from "./ApiService";

export const syncToCloud = async (localData) => {
  try {
    const response = await postData("/sync/upload", { data: localData });
    return response.data;
  } catch (err) {
    console.error("Cloud Sync Failed:", err);
  }
};

export const syncFromCloud = async () => {
  try {
    const response = await getData("/sync/download");
    return response.data;
  } catch (err) {
    console.error("Cloud Fetch Failed:", err);
  }
};