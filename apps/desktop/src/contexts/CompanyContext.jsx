import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { dbService } from '../services/dbService';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      let companyList = [];

      // 1. Offline First: Try to fetch from Local SQLite DB via Electron IPC
      if (window.electron && window.electron.db) {
        companyList = await window.electron.db.getCompanies();
      }

      // 2. Sync-Down: If local DB is empty, fetch from Cloud API and save locally
      if (!companyList || companyList.length === 0) {
        const response = await api.get('/api/company');
        const cloudCompanies = response.companies || response.data || (Array.isArray(response) ? response : []);
        
        if (cloudCompanies.length > 0) {
          if (window.electron && window.electron.db) {
            for (const comp of cloudCompanies) {
              await window.electron.db.saveCompany({
                uuid: comp._id,
                name: comp.name,
                email: comp.email,
                phone: comp.phone,
                address: comp.address,
                gstNumber: comp.gstNumber,
                website: comp.website
              });
            }
            // Reload from local DB to get consistent structure
            companyList = await window.electron.db.getCompanies();
          } else {
            companyList = cloudCompanies;
          }
        }
      }

      setCompanies(companyList);

      // Restore selected company securely
      const storedCompanyId = dbService.getCompanyId();
      const foundCompany = companyList.find(c => (c._id === storedCompanyId || c.uuid === storedCompanyId));

      if (foundCompany) {
        setSelectedCompany(foundCompany);
      } else if (companyList.length > 0 && !selectedCompany) {
        setSelectedCompany(companyList[0]);
        dbService.setCompanyId(companyList[0]._id || companyList[0].uuid);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    dbService.setCompanyId(company._id || company.uuid);
  };

  const addCompany = (company) => {
    // 1. Check Limit for Free Plan (Assuming 'basic' is free)
    // You might want to fetch the user's plan from a UserContext or similar
    const isPremium = false; // Replace with actual check: user?.plan === 'premium'
    const limit = isPremium ? 10 : 2;
    
    if (companies.length >= limit) {
      alert(`Free plan limit reached! You can only create ${limit} companies. Upgrade to Premium for more.`);
      return false; // Indicate failure
    }

    // 2. Check for Duplicate Names and Auto-rename
    const newName = company.name.trim();
    const existingNames = companies.map(c => c.name.toLowerCase());
    
    if (existingNames.includes(newName.toLowerCase())) {
      // STOP: Do not auto-rename. Warn the user instead.
      alert(`Company name "${newName}" already exists!\n\nPlease use a unique name for your list (e.g., "${newName} - Unit 2" or "${newName} Mumbai").\n\nYou can set the 'Print Name' separately for billing.`);
      return false; // Indicate failure
    }
    
    // Logic for Billing Name:
    // If the UI passes 'printName', use it. Otherwise, default to the internal name.
    // Ideally, your Add Company form should have a separate "Print Name" field.
    if (!company.printName) {
      company.printName = newName;
    }

    setCompanies(prev => [...prev, company]);
    if (!selectedCompany) setSelectedCompany(company);
    return true; // Indicate success
  };

  const updateCompany = (updatedCompany) => {
    setCompanies(prev => prev.map(c => c._id === updatedCompany._id ? updatedCompany : c));
    if (selectedCompany && selectedCompany._id === updatedCompany._id) {
      setSelectedCompany(updatedCompany);
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      // NOTE: This assumes a DELETE endpoint exists at /api/company/:id
      // You may need to add this to your backend and api service file.
      await api.delete(`/api/company/${companyId}`);

      setCompanies(prev => prev.filter(c => c._id !== companyId));

      // If the deleted company was selected, clear it or select another one.
      if (selectedCompany && selectedCompany._id === companyId) {
        const remainingCompanies = companies.filter(c => c._id !== companyId);
        if (remainingCompanies.length > 0) {
          selectCompany(remainingCompanies[0]);
        } else {
          setSelectedCompany(null);
          dbService.clearCompanyId();
        }
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert("Failed to delete company. Please check your connection or try again.");
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompany,
      loading,
      selectCompany,
      addCompany,
      updateCompany,
      deleteCompany,
      refetchCompanies: fetchCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
};