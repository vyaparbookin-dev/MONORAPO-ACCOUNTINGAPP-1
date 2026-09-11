import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
    const allDemoCompanies = [
    {
      _id: "co_royal_spice_9425574230",
      name: "🍽️ श्री गणेश रॉयल डाइन & कैफे (Royal Dine)",
      businessType: "restaurant",
      industryType: "restaurant",
      address: "Main City Center Road, Near Gandhi Chowk",
      phone: "9425574230",
      gstin: "22AAAAA0000A1Z5",
      isDemo: false
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
      _id: "demo_company_banquet",
      name: "🏨 Grand Imperial Hotel & Banquet",
      businessType: "banquet",
      industryType: "banquet",
      address: "Ring Road Express, New Delhi",
      phone: "9876543211",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_gamezone",
      name: "🎮 CyberVerse VR & Gamezone Park",
      businessType: "gamezone",
      industryType: "gamezone",
      address: "Mall Level 3, Sector 18, Noida",
      phone: "9876543212",
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
    },
    {
      _id: "demo_company_electronics",
      name: "📱 Apex Mobile & Electronics Hub (IMEI)",
      businessType: "electronics",
      industryType: "electronics",
      address: "Nehru Place Tech Market, New Delhi",
      phone: "9876543214",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
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
      _id: "demo_company_salon",
      name: "💇‍♀️ Glamour Locks Salon & Spa",
      businessType: "salon",
      industryType: "salon",
      address: "High Street Plaza, 2nd Floor",
      phone: "9876543216",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_garments",
      name: "👗 Trendz Garments & Footwear Matrix",
      businessType: "garments",
      industryType: "garments",
      address: "Fashion Hub, Shop 108",
      phone: "9876543217",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    }
  ];
  const fallbackDemoCompany = allDemoCompanies[0];


  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Only fetch companies if a token exists. This prevents 401 errors on public pages like login/register.
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      fetchCompanies();
    } else {
      console.log("[Company Debug] No token found, skipping company fetch.");
      setLoading(false); // If no token, stop loading and show children (e.g., Login screen)
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/company');
      const rawList = response?.companies || response?.data?.companies || response?.data || response;
      const companyList = Array.isArray(rawList) ? rawList : (Array.isArray(rawList?.companies) ? rawList.companies : allDemoCompanies);
      
      const finalCompanies = (companyList && companyList.length > 0) ? companyList : allDemoCompanies;
      setCompanies(finalCompanies);

      const storedCompanyId = localStorage.getItem("companyId") || localStorage.getItem("selectedCompany");
      const foundCompany = finalCompanies.find(c => c._id === storedCompanyId || c._id?.toString() === storedCompanyId?.toString());

      if (foundCompany) {
        setSelectedCompany(foundCompany);
      } else {
        setSelectedCompany(finalCompanies[0]);
        localStorage.setItem("companyId", finalCompanies[0]._id);
      }
    } catch (error) {
      console.warn('Applying demo companies fallback:', error);
      setCompanies(allDemoCompanies);
      setSelectedCompany(fallbackDemoCompany);
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