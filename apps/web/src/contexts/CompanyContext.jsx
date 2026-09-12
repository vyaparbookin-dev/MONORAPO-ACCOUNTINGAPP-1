import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const allDemoCompanies = [
    {
      _id: "demo_company_hardware",
      name: "🔧 Bharat Hardware, Plywood & Paints",
      businessType: "hardware",
      industryType: "hardware",
      address: "Timber & Hardware Market, Plot 44",
      phone: "9876543215",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_restaurant",
      name: "🍽️ Royal Spice Restaurant & Cafe",
      businessType: "restaurant",
      industryType: "restaurant",
      address: "12 Food Street, Connaught Place, New Delhi",
      phone: "9876543210",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_supermarket",
      name: "🛒 Apna Bazaar Supermarket & Kirana",
      businessType: "supermarket",
      industryType: "supermarket",
      address: "Main Market, Gandhi Chowk",
      phone: "9876543213",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    }
  ];

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      fetchCompanies();
    } else {
      console.log("[Company Debug] No token found, skipping company fetch.");
      setLoading(false);
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const isGuestMode = localStorage.getItem("isGuestMode") === "true";
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const isDemoGuest = token && token.includes("demo_guest");

      if (isGuestMode || isDemoGuest) {
        setCompanies(allDemoCompanies);
        const storedCoId = localStorage.getItem("companyId");
        const found = allDemoCompanies.find(c => c._id === storedCoId) || allDemoCompanies[0];
        setSelectedCompany(found);
        localStorage.setItem("companyId", found._id);
        setLoading(false);
        return;
      }

      // Real User Mode: Fetch from backend
      const response = await api.get('/api/company');
      const rawList = response?.companies || response?.data?.companies || response?.data || response;
      const serverCompanies = Array.isArray(rawList) ? rawList : (Array.isArray(rawList?.companies) ? rawList.companies : []);

      if (serverCompanies.length > 0) {
        setCompanies(serverCompanies);

        // Check user object in localStorage for default companyId
        let defaultCompanyId = localStorage.getItem("companyId") || localStorage.getItem("selectedCompany");
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.companyId) defaultCompanyId = u.companyId;
          }
        } catch (e) {}

        const matchedCo = serverCompanies.find(c => 
          c._id === defaultCompanyId || 
          c._id?.toString() === defaultCompanyId?.toString() ||
          c.id === defaultCompanyId
        ) || serverCompanies[0];

        setSelectedCompany(matchedCo);
        localStorage.setItem("companyId", matchedCo._id || matchedCo.id);
        localStorage.setItem("selectedCompany", matchedCo._id || matchedCo.id);
      } else {
        // Create user fallback company representation from localStorage
        let fallbackName = "My Business";
        let fallbackCoId = localStorage.getItem("companyId") || "my_primary_company";
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.companyName) fallbackName = u.companyName;
            else if (u.name) fallbackName = `${u.name}'s Business`;
            if (u.companyId) fallbackCoId = u.companyId;
          }
        } catch (e) {}

        const fallbackUserCo = {
          _id: fallbackCoId,
          name: fallbackName,
          businessType: "general",
          industryType: "general",
          isDemo: false
        };

        setCompanies([fallbackUserCo]);
        setSelectedCompany(fallbackUserCo);
        localStorage.setItem("companyId", fallbackCoId);
      }
    } catch (error) {
      console.warn('[CompanyContext] Error fetching companies:', error);
      // Don't overwrite real user company on transient error
      const storedCoId = localStorage.getItem("companyId");
      if (storedCoId && !storedCoId.includes("demo_")) {
        let coName = "My Business";
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          if (u.name) coName = `${u.name}'s Business`;
        } catch (e) {}
        const preservedCo = { _id: storedCoId, name: coName, isDemo: false };
        setCompanies([preservedCo]);
        setSelectedCompany(preservedCo);
      } else {
        setCompanies(allDemoCompanies);
        setSelectedCompany(allDemoCompanies[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    const coId = company._id || company.id;
    localStorage.setItem("companyId", coId);
    localStorage.setItem("selectedCompany", coId);
  };

  const addCompany = (company) => {
    setCompanies(prev => [...prev, company]);
    if (!selectedCompany) setSelectedCompany(company);
    return true;
  };

  const updateCompany = (updatedCompany) => {
    setCompanies(prev => prev.map(c => (c._id === updatedCompany._id || c.id === updatedCompany.id) ? updatedCompany : c));
    if (selectedCompany && (selectedCompany._id === updatedCompany._id || selectedCompany.id === updatedCompany.id)) {
      setSelectedCompany(updatedCompany);
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      await api.delete(`/api/company/${companyId}`);
      setCompanies(prev => prev.filter(c => c._id !== companyId && c.id !== companyId));
      if (selectedCompany && (selectedCompany._id === companyId || selectedCompany.id === companyId)) {
        const remaining = companies.filter(c => c._id !== companyId && c.id !== companyId);
        if (remaining.length > 0) {
          selectCompany(remaining[0]);
        } else {
          setSelectedCompany(null);
          localStorage.removeItem("companyId");
          localStorage.removeItem("selectedCompany");
        }
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert("Failed to delete company. Please try again.");
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
