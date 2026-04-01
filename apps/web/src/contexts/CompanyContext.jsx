import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Only fetch companies if a token exists. This prevents 401 errors on public pages like login/register.
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      fetchCompanies();
    } else {
      setLoading(false); // If no token, stop loading and show children (e.g., Login screen)
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/company');
      // Handle multiple possible response structures: { companies: [] }, { data: [] }, or []
      const companyList = response.companies || response.data || (Array.isArray(response) ? response : []);
      setCompanies(companyList);

      // Restore selected company from localStorage if available
      const storedCompanyId = localStorage.getItem("companyId");
      const foundCompany = companyList.find(c => c._id === storedCompanyId);

      if (foundCompany) {
        setSelectedCompany(foundCompany);
      } else if (companyList.length > 0 && !selectedCompany) {
        setSelectedCompany(companyList[0]);
        localStorage.setItem("companyId", companyList[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    localStorage.setItem("companyId", company._id);
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
          localStorage.removeItem("companyId");
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