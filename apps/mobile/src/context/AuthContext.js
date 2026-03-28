import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_ROUTES } from '@repo/shared';
import { getData, postData } from '../services/ApiService';
import { initDB } from '../../db';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // 1. Initialize Local Database (Offline-First Setup)
        await initDB();

        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // You might want to fetch user data here using the token
          
          // Load companyId for SaaS isolation
          let storedCompanyId = await AsyncStorage.getItem('companyId');
          console.log("App Reloaded -> Token:", !!storedToken, "| Company ID:", storedCompanyId || "Not Found");

          // AUTO-FETCH COMPANY IF MISSING:
          if (!storedCompanyId) {
            try {
              const companyRes = await getData('/api/company');
              const data = companyRes.data || {};
              const companies = Array.isArray(data.companies) ? data.companies : (Array.isArray(data) ? data : []);
              if (companies.length > 0) {
                storedCompanyId = companies[0]._id.toString();
                await AsyncStorage.setItem('companyId', storedCompanyId);
                console.log("App Reloaded -> Fetched and set first Company ID:", storedCompanyId);
              }
            } catch (err) {
              console.error("Failed to auto-fetch companies on reload", err);
            }
          }

          // For now, we'll just set a dummy user if a token exists
          setUser({ name: 'User' }); 
          
          // FIX: Call setToken ONLY after companyId is completely resolved
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (email, password) => {
    try {
      // Use postData from ApiService which handles the correct URL (IP address)
      const response = await postData(API_ROUTES.AUTH.LOGIN, { email, password });
      const { token, user } = response.data || response;
      
      // 1. Sabse pehle token storage mein save karein taaki aage ki API call authorized ho sake
      await AsyncStorage.setItem('authToken', token);

      // 2. Phir Company ID set/fetch karein
      if (user.company) {
        await AsyncStorage.setItem('companyId', user.company.toString());
        console.log('Login Success -> Saved Company ID:', user.company);
      } else if (user.companyId) {
        await AsyncStorage.setItem('companyId', user.companyId.toString());
        console.log('Login Success -> Saved Company ID:', user.companyId);
      } else {
        console.warn('Login Warning -> No Company ID found in user object! Fetching from API...');
        try {
          const companyRes = await getData('/api/company');
          const data = companyRes.data || {};
          const companies = Array.isArray(data.companies) ? data.companies : (Array.isArray(data) ? data : []);
          if (companies.length > 0) {
            await AsyncStorage.setItem('companyId', companies[0]._id.toString());
            console.log('Login Success -> Fetched and saved first Company ID:', companies[0]._id);
          } else {
            console.warn('No companies found for this user!');
          }
        } catch (err) {
          console.error("Failed to fetch companies during login", err);
        }
      }

      // 3. Sab kuch save hone ke BAAD React State update karein (Ye app ko next screen pe bhejega)
      setToken(token);
      setUser(user);
      // You might want to store user info as well
      // await AsyncStorage.setItem('user', JSON.stringify(user));

    } catch (error) {
      console.error('Login failed', error);
      // You might want to throw the error to handle it in the login screen
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('companyId');
      // await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
