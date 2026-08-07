import { useState, useEffect } from "react";
import { api, getStorage, setStorage } from "../services/api";
import { API_ROUTES } from "../constant/apiRoutes";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    // Use the centralized api instance. It will handle errors and unwrapping.
    const response = await api.post(API_ROUTES.AUTH.LOGIN, credentials);
    if (response?.token) {
      await setStorage("authToken", response.token); // Use shared storage helper
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await setStorage("authToken", ""); // Use shared storage helper
    setUser(null);
  };

  const verifyToken = async () => {
    const token = await getStorage("authToken"); // Use shared storage helper
    if (!token) return;
    try {
      // The shared api instance will automatically add the token to the header.
      const response = await api.post(API_ROUTES.AUTH.VERIFY_TOKEN, {});
      if (response?.user) {
        setUser(response.user);
      } else {
        await logout();
      }
    } catch (error) {
      await logout();
    }
  };

  useEffect(() => { verifyToken(); }, []);

  return { user, login, logout };
};