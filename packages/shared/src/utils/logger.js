import axios from "axios";

export const log = async (msg, type = "info") => {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${msg}`);

  if (navigator.onLine) {
    try {
      await axios.post("/api/logs", { time: timestamp, type, message: msg });
    } catch (err) {
      console.warn("Log send failed (offline or server error).");
    }
  }
}