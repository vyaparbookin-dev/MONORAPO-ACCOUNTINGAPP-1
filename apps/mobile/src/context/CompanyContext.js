import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getData } from '../services/ApiService';
import { getCompaniesLocal, addCompanyLocal } from '../../db';
import { AuthContext } from './AuthContext';

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  const refetchCompanies = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Offline First: Try to load from local DB
      let localCompanies = await getCompaniesLocal().catch(() => []);
      
      // 2. Cloud Sync: Fetch from API
      const res = await getData('/company').catch(() => null);
      const cloudCompanies = res?.companies || [];

      // 3. Sync cloud data to local DB if local is empty or outdated
      if (cloudCompanies.length > 0) {
        // A simple sync logic can be to just replace if counts differ, or more complex logic
        if (localCompanies.length !== cloudCompanies.length) {
          for (const comp of cloudCompanies) {
            await addCompanyLocal({ uuid: comp._id, ...comp });
          }
          localCompanies = await getCompaniesLocal();
        }
      }
      
      setCompanies(localCompanies || []);

      // 4. Set the active company
      const currentCompanyId = await AsyncStorage.getItem('companyId');
      const activeCompany = localCompanies.find(c => (c.uuid || c._id) === currentCompanyId);
      
      if (activeCompany) {
        setSelectedCompany(activeCompany);
      } else if (localCompanies.length > 0) {
        // If no company is selected, select the first one
        await selectCompany(localCompanies[0]);
      }

    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetchCompanies();
  }, [refetchCompanies]);

  const selectCompany = async (company) => {
    if (!company) return;
    const companyId = company.uuid || company._id;
    console.log(`Switching company context to: ${company.name} (ID: ${companyId})`);
    await AsyncStorage.setItem('companyId', companyId.toString());
    setSelectedCompany(company);
  };

  if (loading && !companies.length) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, loading, selectCompany, refetchCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);