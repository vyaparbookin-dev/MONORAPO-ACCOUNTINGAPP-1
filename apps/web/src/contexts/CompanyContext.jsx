import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const allDemoCompanies = [
    {
      _id: "6a8314470d93e58ad0920950",
      name: "🔧 Ganesh Hardware, Plywood & Paints",
      businessType: "hardware",
      industryType: "hardware",
      address: "Timber & Hardware Market, Plot 44",
      phone: "7828289433",
      gstin: "22AAAAA0000A1Z5",
      isDemo: false
    },
    {
      _id: "6a8314470d93e58ad0920952",
      name: "🍽️ Royal Spice Restaurant & Cafe",
      businessType: "restaurant",
      industryType: "restaurant",
      address: "12 Food Street, Connaught Place, New Delhi",
      phone: "9876543210",
      gstin: "07AAAAA0000A1Z5",
      isDemo: false
    },
    {
      _id: "demo_company_trading",
      name: "🏢 श्री गणेश ट्रेडर्स व जनरल स्टोर",
      businessType: "retail",
      industryType: "retail",
      address: "मेन मार्केट, व्यापार भवन",
      phone: "9876543210",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_gamezone",
      name: "🎮 FunZone Arcade, VR & Bowling",
      businessType: "gamezone",
      industryType: "gamezone",
      address: "Phoenix Mall, 3rd Floor, Bangalore",
      phone: "9876543219",
      gstin: "29AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "6a8314470d93e58ad0920950",
      name: "🔧 Bharat Hardware, Plywood & Paints",
      businessType: "hardware",
      industryType: "hardware",
      address: "Timber & Hardware Market, Plot 44",
      phone: "9876543215",
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
      _id: "demo_company_banquet",
      name: "🏨 Royal Palace Hotel & Banquet",
      businessType: "banquet",
      industryType: "banquet",
      address: "Ring Road, Civil Lines, Jaipur",
      phone: "9876543211",
      gstin: "08AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_mobile",
      name: "📱 Galaxy Mobile & Electronics Store",
      businessType: "mobile",
      industryType: "mobile",
      address: "Nehru Place IT Hub, Shop 14",
      phone: "9876543212",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_salon",
      name: "💇‍♀️ Glamour Look Salon & Spa",
      businessType: "salon",
      industryType: "salon",
      address: "Link Road, Bandra West, Mumbai",
      phone: "9876543214",
      gstin: "27AAAAA0000A1Z5",
      isDemo: true
    },
    {
      _id: "demo_company_core",
      name: "📖 Shri Ganesh Trading Co. (डे-बुक व रोकड़)",
      businessType: "core",
      industryType: "core",
      address: "Naya Bazaar, Chandni Chowk, Delhi",
      phone: "9876543216",
      gstin: "07AAAAA0000A1Z5",
      isDemo: true
    }
  ];

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndFetch = () => {
      fetchCompanies();
    };

    checkAndFetch();
    window.addEventListener("storage", checkAndFetch);
    return () => window.removeEventListener("storage", checkAndFetch);
  }, []);

  const clearStaleCompanyLocalData = () => {
    const staleKeys = [
      "vb_local_manual_bills",
      "vb_local_parties",
      "vb_local_products",
      "vb_local_expenses",
      "vb_local_pagarbook_summary",
      "vb_local_staff",
      "vb_offline_sync_queue",
      "sync_queue",
      "bills",
      "parties",
      "products",
      "inventory",
      "expenses",
      "staff",
      "pagarbook_summary",
      "selectedCompany",
      "companyId"
    ];

    staleKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
  };

  const fetchCompanies = async () => {
    try {
      const isGuestMode = localStorage.getItem("isGuestMode") === "true";
      const isDemoActive = localStorage.getItem("isDemoActive") === "true";
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const isDemoGuest = token && token.includes("demo_guest");

      if (isDemoActive || isGuestMode || isDemoGuest) {
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
        const realCompanies = serverCompanies.filter(c => !c.isDemo && !(c._id || c.id || '').toString().startsWith('demo_'));
        const candidateCompanies = realCompanies.length > 0 ? realCompanies : serverCompanies;
        setCompanies(candidateCompanies);

        // Check user object in localStorage for default companyId
        let defaultCompanyId = localStorage.getItem("companyId") || localStorage.getItem("selectedCompany");
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.companyId) defaultCompanyId = u.companyId;
          }
        } catch (e) {}

        const storedCoId = String(defaultCompanyId || '').trim();
        const matchedCo = candidateCompanies.find(c => 
          (c._id || c.id)?.toString() === storedCoId ||
          (c._id || c.id)?.toString() === String(defaultCompanyId || '') ||
          c.name === storedCoId
        ) || candidateCompanies.find(c => !(c._id || c.id || '').toString().startsWith('demo_')) || candidateCompanies[0];

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
    if (!company) return;
    const coId = typeof company === 'string' ? company : (company._id || company.id || '');
    const previousCoId = localStorage.getItem('companyId');
    const fullCompany = typeof company === 'object' && company !== null ? company : (companies.find(c => c._id === coId || c.id === coId) || { _id: coId, name: 'My Business' });

    if (coId && previousCoId && previousCoId !== coId) {
      clearStaleCompanyLocalData();
    }

    setSelectedCompany(fullCompany);
    if (coId) {
      localStorage.setItem("companyId", coId);
      localStorage.setItem("selectedCompany", coId);
    }
  };

  const addCompany = (company) => {
    if (!company) return false;
    setCompanies(prev => Array.isArray(prev) ? [...prev, company] : [company]);
    if (!selectedCompany) setSelectedCompany(company);
    return true;
  };

  const updateCompany = (updatedCompany) => {
    if (!updatedCompany) return;
    const upId = updatedCompany._id || updatedCompany.id;
    setCompanies(prev => Array.isArray(prev) ? prev.map(c => (c._id === upId || c.id === upId) ? updatedCompany : c) : [updatedCompany]);
    if (selectedCompany && (selectedCompany._id === upId || selectedCompany.id === upId)) {
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

  const enterDemoModule = (industry = "retail") => {
    const cleanInd = String(industry).toLowerCase();
    const matched = allDemoCompanies.find(c => 
      c.industryType?.toLowerCase() === cleanInd || 
      c.businessType?.toLowerCase() === cleanInd ||
      c._id?.toLowerCase().includes(cleanInd) ||
      c.name?.toLowerCase().includes(cleanInd)
    ) || allDemoCompanies[0]; // default to general retail

    // If currently in a real company, safely back it up
    if (selectedCompany && !selectedCompany.isDemo) {
      if (selectedCompany._id) {
        localStorage.setItem("real_backup_companyId", selectedCompany._id);
      }
      const realToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (realToken && !realToken.includes("demo_guest")) {
        localStorage.setItem("real_backup_token", realToken);
      }
    }

    // If guest visitor without auth token, provide instant safe guest token
    const currentToken = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!currentToken) {
      const demoUser = {
        _id: "demo_guest_user_101",
        name: "Guest Explorer (सैंडबॉक्स)",
        email: "demo@vyaparbook.in",
        role: "admin",
        companyId: matched._id,
        isGuest: true
      };
      localStorage.setItem("authToken", "demo_guest_token_2026_valid");
      localStorage.setItem("token", "demo_guest_token_2026_valid");
      localStorage.setItem("user", JSON.stringify(demoUser));
    }

    localStorage.setItem("isDemoActive", "true");
    localStorage.setItem("companyId", matched._id);
    localStorage.setItem("selectedCompany", matched._id);
    setSelectedCompany(matched);
    return matched;
  };

  const exitDemoModule = () => {
    localStorage.removeItem("isDemoActive");
    const realCoId = localStorage.getItem("real_backup_companyId");
    localStorage.removeItem("real_backup_companyId");

    const realToken = localStorage.getItem("real_backup_token");
    if (realToken) {
      localStorage.setItem("authToken", realToken);
      localStorage.setItem("token", realToken);
      localStorage.removeItem("real_backup_token");
    }

    const realCo = (realCoId && companies.find(c => c._id === realCoId || c.id === realCoId)) || 
                   companies.find(c => !c.isDemo) || 
                   companies[0];
    if (realCo) {
      const id = realCo._id || realCo.id;
      localStorage.setItem("companyId", id);
      localStorage.setItem("selectedCompany", id);
      setSelectedCompany(realCo);
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
      enterDemoModule,
      exitDemoModule,
      allDemoCompanies,
      refetchCompanies: fetchCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
};
