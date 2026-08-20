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
      const cloudCompanies = res?.companies || res?.data?.companies || (Array.isArray(res) ? res : []);

      const finalCompanies = cloudCompanies.length > 0 ? cloudCompanies : localCompanies;
      
      // Fallback if both empty: Create default Ganesh Hardware object
      if (finalCompanies.length === 0) {
        finalCompanies.push({
          _id: '6a8314470d93e58ad0920950',
          uuid: '6a8314470d93e58ad0920950',
          name: 'Ganesh Hardware',
          businessType: 'Hardware & Building Materials',
          email: 'ankush.bani@gmail.com',
          phone: '+91 9876543210'
        });
      }

      setCompanies(finalCompanies);

      // 4. Set the active company
      const currentCompanyId = await AsyncStorage.getItem('companyId');
      const activeCompany = finalCompanies.find(c => (c.uuid || c._id)?.toString() === currentCompanyId?.toString());
      
      if (activeCompany) {
        setSelectedCompany(activeCompany);
      } else if (finalCompanies.length > 0) {
        setSelectedCompany(finalCompanies[0]);
        await AsyncStorage.setItem('companyId', (finalCompanies[0]._id || finalCompanies[0].uuid).toString());
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